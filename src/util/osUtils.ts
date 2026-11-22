export function isOSWindows(): boolean {
    return process.platform === "win32";
}
export function isOSUnixoid(): boolean {
    const platform = process.platform;
    return (
        platform === "linux" ||
        platform === "darwin" ||
        platform === "freebsd" ||
        platform === "openbsd"
    );
}
export function isOSUnix(): boolean {
    const platform = process.platform;
    return (
        platform === "linux" ||
        platform === "freebsd" ||
        platform === "openbsd"
    );
}
export function isOSMacOS(): boolean {
    return process.platform === "darwin";
}
export function correctBinname(binname: string): string {
    return binname + (process.platform === "win32" ? ".exe" : "");
}
export function correctScriptName(binname: string): string {
    return binname + (process.platform === "win32" ? ".bat" : "");
}