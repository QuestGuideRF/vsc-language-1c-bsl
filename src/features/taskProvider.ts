import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
export default class TaskProvider {
    public onConfigurationChanged() {
        type AutoDetect = "on" | "off";
        const autoDetect = vscode.workspace
            .getConfiguration("language-1c-bsl")
            .get<AutoDetect>("autoDetect");
        if (!vscode.workspace.workspaceFolders) {
            return;
        }
        if (autoDetect === "on") {
            vscode.tasks.registerTaskProvider("bsl", {
                provideTasks: () => {
                    return this.provideBslScripts();
                },
                resolveTask(): vscode.Task | undefined {
                    return undefined;
                }
            });
        }
    }
    private provideBslScripts(): vscode.Task[] {
        const emptyTasks: vscode.Task[] = [];
        const allTasks: vscode.Task[] = [];
        const folders = vscode.workspace.workspaceFolders;
        if (!folders) {
            return emptyTasks;
        }
        try {
            for (const folder of folders) {
                if (
                    this.isEnabled(folder) &&
                    folder ===
                        vscode.workspace.getWorkspaceFolder(
                            vscode.window.activeTextEditor.document.uri
                        )
                ) {
                    allTasks.push(...this.fillDefaultTasks(folder.uri.fsPath));
                    const tasks = this.provideBslScriptsForFolder(folder.uri.fsPath);
                    allTasks.push(...tasks);
                }
            }
            return allTasks;
        } catch (error) {
            return error;
        }
    }
    private isEnabled(folder: vscode.WorkspaceFolder): boolean {
        return (
            vscode.workspace.getConfiguration("language-1c-bsl", folder.uri).get("autoDetect") ===
            "on"
        );
    }
    private fillDefaultTasks(workspaceRoot) {
        const result: vscode.Task[] = [];
        result.push(
            this.createTask(
                "OneScript: скомпилировать",
                workspaceRoot,
                "oscript",
                ["-compile", "${file}"],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "OneScript: проверьте",
                workspaceRoot,
                "oscript",
                ["-check", "${file}"],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "OneScript: сделать",
                workspaceRoot,
                "oscript",
                ["-make", "${file}", "${fileBasename}.exe"],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "OneScript: запустить",
                workspaceRoot,
                "oscript",
                ["${file}"],
                ["$OneScript Линтер"],
                true
            )
        );
        result.push(
            this.createTask(
                "1testrunner: Тестовый проект",
                workspaceRoot,
                "cmd",
                ["1testrunner", "-runall", "${workspaceRoot}/тесты"],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "1testrunner: Тестирование текущего тестового файла",
                workspaceRoot,
                "cmd",
                ["1testrunner", "-run", "${file}"],
                ["$OneScript Линтер"],
                false,
                true
            )
        );
        result.push(
            this.createTask(
                "OPM: сборка пакета",
                workspaceRoot,
                "cmd",
                ["opm", "build", "${workspaceRoot}"],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "1bdd: реализовать все функции",
                workspaceRoot,
                "cmd",
                ["1bdd", "${workspaceRoot}/функции", "-out", "${workspaceRoot}/exec.log"],
                ["$OneScript Линтер"],
                true
            )
        );
        result.push(
            this.createTask(
                "1bdd: Функция руководителя",
                workspaceRoot,
                "cmd",
                ["1bdd", "${file}", "-fail-fast", "-require", "${workspaceRoot}/функции", "-out", "${workspaceRoot}/exec.log"],
                ["$OneScript Линтер"],
                false,
                true
            )
        );
        result.push(
            this.createTask(
                "1bdd: функция Exec для определения текущего шага",
                workspaceRoot,
                "cmd",
                [
                    "1bdd",
                    "${fileDirname}/../${fileBasenameNoExtension}.feature",
                    "-fail-fast",
                    "-require",
                    "${workspaceRoot}/функции",
                    "-out",
                    "${workspaceRoot}/exec.log"
                ],
                ["$OneScript Линтер"],
                false,
                true
            )
        );
        result.push(
            this.createTask(
                "1bdd: функция Exec + отладка",
                workspaceRoot,
                "cmd",
                [
                    "1bdd",
                    "${file}",
                    "-fail-fast",
                    "-require",
                    "${workspaceRoot}/функции",
                    "-verbose",
                    "on",
                    "-out",
                    "${workspaceRoot}/exec.log"
                ],
                ["$OneScript Линтер"]
            )
        );
        result.push(
            this.createTask(
                "1bdd: Создание шагов функции",
                workspaceRoot,
                "cmd",
                ["1bdd", "gen", "${file}", "-out", "${workspaceRoot}/exec.log"],
                ["$OneScript Линтер"]
            )
        );
        return result;
    }
    private createTask(
        label: string,
        workspaceRoot,
        command,
        args?: string[],
        problemMatcher?: string[],
        isBuildCommand = false,
        isTestCommand = false
    ): vscode.Task {
        const kind: vscode.TaskDefinition = {
            label,
            type: "bsl",
            args,
            problemMatcher
        };
        if (command === "cmd") {
            const isWin = /^win/.test(process.platform);
            command = isWin ? "cmd" : "sh";
            const argsWin = args.slice();
            const argsLin = args.slice();
            args.unshift(isWin ? "/c" : "-c");
            argsWin.unshift("/c");
            argsLin.unshift("-c");
            kind.windows = {
                command: "cmd",
                args: argsWin
            };
            kind.linux = {
                command: "sh",
                args: argsLin
            };
        } else {
            kind.command = command;
        }
        const task = new vscode.Task(
            kind,
            vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri),
            label,
            command,
            new vscode.ProcessExecution(command, args, { cwd: workspaceRoot }),
            problemMatcher
        );
        if (isBuildCommand) {
            task.group = vscode.TaskGroup.Build;
        }
        if (isTestCommand) {
            task.group = vscode.TaskGroup.Test;
        }
        return task;
    }
    private provideBslScriptsForFolder(workspaceRoot: string): vscode.Task[] {
        const emptyTasks: vscode.Task[] = [];
        const tasksFolder = path.join(workspaceRoot, "tasks");
        if (!fs.existsSync(tasksFolder)) {
            return emptyTasks;
        }
        try {
            const result: vscode.Task[] = [];
            const taskFiles = fs.readdirSync(tasksFolder);
            for (const taskFile of taskFiles) {
                const filename = path.join(tasksFolder, taskFile);
                const stat = fs.lstatSync(filename);
                if (stat.isDirectory()) {
                    continue;
                }
                const label = taskFile;
                result.push(
                    this.createTask(
                        "Выполнить задачу: " + label,
                        workspaceRoot,
                        "cmd",
                        ["oscript", "${workspaceRoot}/задачи/" + label],
                        ["$OneScript Линтер"],
                        true
                    )
                );
            }
            return result;
        } catch (e) {
            return emptyTasks;
        }
    }
}