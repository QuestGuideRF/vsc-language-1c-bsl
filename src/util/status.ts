import * as vscode from "vscode";
export interface IStatus {
    update(msg: string): void;
}
export class StatusBarEntry implements IStatus {
    private barItem: vscode.StatusBarItem;
    private readonly prefix?: string;
    constructor(context: vscode.ExtensionContext, prefix?: string) {
        this.prefix = prefix;
        this.barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        context.subscriptions.push(this.barItem);
    }
    public show(): void {
        this.barItem.show();
    }
    public update(msg: string): void {
        this.barItem.text = `${this.prefix} ${msg}`;
    }
    public dispose(): void {
        this.barItem.dispose();
    }
}