import * as extractZipWithCallback from "extract-zip";
import * as fs from "fs-extra";
import { jsonDateParser } from "json-date-parser";
import * as path from "path";
import * as requestPromise from "request-promise-native";
import * as semver from "semver";
import { promisify } from "util";
import BSLLanguageServerDownloadChannel from "./bsllsDownloadChannel";
import { download } from "./downloadUtils";
import { IGitHubReleasesAPIResponse } from "./githubApi";
import { IStatus } from "./status";

const extractZip = promisify(extractZipWithCallback);

export interface IServerInfo {
    version: string;
    lastUpdate: number;
}

export class ServerDownloader {
    private readonly displayName: string;
    private readonly githubOrganization: string;
    private readonly githubProjectName: string;
    private readonly assetName: string;
    private readonly installDir: string;
    private readonly token: string;

    constructor(
        displayName: string,
        githubOrganization: string,
        githubProjectName: string,
        assetName: string,
        installDir: string,
        token: string
    ) {
        this.displayName = displayName;
        this.githubOrganization = githubOrganization;
        this.githubProjectName = githubProjectName;
        this.installDir = installDir;
        this.assetName = assetName;
        this.token = token;
    }

    public async downloadServerIfNeeded(status: IStatus, channel: BSLLanguageServerDownloadChannel): Promise<string> {
        const serverInfo = await this.installedServerInfo();
        const serverInfoOrDefault = serverInfo || {
            version: "0.0.0",
            lastUpdate: Number.MIN_SAFE_INTEGER
        };
        const secondsSinceLastUpdate = (Date.now() - serverInfoOrDefault.lastUpdate) / 1000;

        if (secondsSinceLastUpdate < 480) {
            return serverInfoOrDefault.version;
        }

        console.info(`Querying GitHub API for new ${this.displayName} version...`);
        let releaseInfo: IGitHubReleasesAPIResponse;

        try {

            if (channel === BSLLanguageServerDownloadChannel.Stable) {
                releaseInfo = await this.latestStableReleaseInfo();
            } else if (channel === BSLLanguageServerDownloadChannel.PreRelease) {
                releaseInfo = await this.latestReleaseInfo();
            } else {
                throw new Error(`Uknown BSL LS download channel: ${channel}`);
            }
        } catch (error) {
            const message = `Could not fetch from GitHub releases API: ${error}.`;
            if (serverInfo == null) {

                throw new Error(message);
            } else {

                console.warn(message);
                return serverInfoOrDefault.version;
            }
        }

        const latestVersion = releaseInfo.tag_name;
        const installedVersion = serverInfoOrDefault.version;
        const serverNeedsUpdate = semver.gt(latestVersion, installedVersion);
        let newVersion = installedVersion;

        if (serverNeedsUpdate) {
            const serverAsset = releaseInfo.assets.find(asset => asset.name === this.assetName);
            if (serverAsset) {
                const downloadUrl = serverAsset.browser_download_url;
                await this.downloadServer(downloadUrl, latestVersion, status);
            } else {
                throw new Error(
                    `Latest GitHub release for ${this.githubProjectName}` +
                        `does not contain the asset '${this.assetName}'!`
                );
            }
            newVersion = latestVersion;
        }

        await this.updateInstalledServerInfo({
            version: newVersion,
            lastUpdate: Date.now()
        });

        return newVersion;
    }

    private async latestStableReleaseInfo(): Promise<IGitHubReleasesAPIResponse> {
        return this.getReleaseInfo("latest");
    }

    private async latestReleaseInfo(): Promise<IGitHubReleasesAPIResponse> {
        const headers: any = { "User-Agent": "vsc-language-1c-bsl" };
        if (this.token) {
            headers.Authorization = `token ${this.token}`;
        }

        const rawJsonReleases = await requestPromise.get(
            `https://api.github.com/repos/${this.githubOrganization}/${this.githubProjectName}/releases`,
            { headers }
        );

        const releases = JSON.parse(rawJsonReleases, jsonDateParser) as IGitHubReleasesAPIResponse[];

        if (releases.length === 0) {
            throw new Error("Project does'n have releases");
        }

        releases.sort((a, b) => b.published_at.getTime() - a.published_at.getTime());

        return this.getReleaseInfo(releases[0].id.toString());
    }

    private async getReleaseInfo(id: string): Promise<IGitHubReleasesAPIResponse> {
        const headers: any = { "User-Agent": "vsc-language-1c-bsl" };
        if (this.token) {
            headers.Authorization = `token ${this.token}`;
        }

        const rawJson = await requestPromise.get(
            `https://api.github.com/repos/${this.githubOrganization}/${this.githubProjectName}/releases/${id}`,
            { headers }
        );
        return JSON.parse(rawJson) as IGitHubReleasesAPIResponse;
    }

    private serverInfoFile(): string {
        return path.join(this.installDir, "SERVER-INFO");
    }

    private async installedServerInfo(): Promise<IServerInfo> {
        try {
            const info = JSON.parse(
                (await fs.promises.readFile(this.serverInfoFile())).toString("utf8")
            ) as IServerInfo;
            return semver.valid(info.version) ? info : null;
        } catch {
            return null;
        }
    }

    private async updateInstalledServerInfo(info: IServerInfo): Promise<void> {
        await fs.promises.writeFile(this.serverInfoFile(), JSON.stringify(info), {
            encoding: "utf8"
        });
    }

    private async downloadServer(
        downloadUrl: string,
        version: string,
        status: IStatus
    ): Promise<void> {
        if (!(await fs.pathExists(this.installDir))) {
            await fs.promises.mkdir(this.installDir, { recursive: true });
        }

        const downloadDest = path.join(this.installDir, `${version}-download-${this.assetName}`);
        status.update(`Downloading ${this.displayName} ${version}...`);
        await download(downloadUrl, downloadDest, percent => {
            status.update(
                `Downloading ${this.displayName} ${version} :: ${(percent * 100).toFixed(2)} %`
            );
        });

        status.update(`Unpacking ${this.displayName} ${version}...`);
        await extractZip(downloadDest, { dir: path.join(this.installDir, version) });
        await fs.promises.unlink(downloadDest);

        status.update(`Initializing ${this.displayName}...`);
    }
}