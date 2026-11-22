import { Disposable, window } from "vscode";
import { MethodDetect } from "./methodDetect";
export class MethodController {
    private methodDetect: MethodDetect;
    private disposable: Disposable;
    constructor(methodDetect: MethodDetect) {
        this.methodDetect = methodDetect;
        this.methodDetect.updateMethodLabel();
        const subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        this.disposable = Disposable.from(...subscriptions);
    }
    public dispose() {
        this.disposable.dispose();
    }
    private _onEvent() {
        this.methodDetect.updateMethodLabel();
    }
}