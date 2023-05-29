import * as vscode from 'vscode';
import { callOpenAI } from './openai';
const CONFIG_SECTION = 'UsefulCode';

export function activate(context: vscode.ExtensionContext) {


	const provider = new ChatViewProvider(context.extensionUri);


	// 注册 Webview 视图提供程序
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('useful_code_sidebar-view', provider)
	);

	// 右键菜单命令 -- 查看代码问题
	context.subscriptions.push(
		vscode.commands.registerCommand("UsefulCode.FindProblemsOfCode", async () => {
			const editor = vscode.window.activeTextEditor;
			const selection = editor?.selection;
			const text = editor?.document.getText(selection) || '';
			provider.postMessage('请你帮我看一下这段代码可能存在的问题\n' + text);
		}));


	// 右键菜单命令 -- 优化代码
	context.subscriptions.push(
		vscode.commands.registerCommand("UsefulCode.OptimizeCode", async () => {
			const editor = vscode.window.activeTextEditor;
			const selection = editor?.selection;
			const text = editor?.document.getText(selection) || '';
			provider.postMessage('请你帮我优化一下这段代码\n' + text);
		}));


	// 右键菜单命令 -- 解释代码
	context.subscriptions.push(
		vscode.commands.registerCommand("UsefulCode.ExplainCode", async () => {
			const editor = vscode.window.activeTextEditor;
			const selection = editor?.selection;
			const text = editor?.document.getText(selection) || '';
			provider.postMessage('请你帮解释一下这段代码\n' + text);
		}));

	// 输入token命令
	context.subscriptions.push(
		vscode.commands.registerCommand('UsefulCode.InputToken', async () => {
			const userToken = await vscode.window.showInputBox({
				prompt: 'Enter your OpenAI API token',
				placeHolder: 'Token'
			});

			if (userToken) {
				// 保存用户的Token
				saveToken(userToken);
				vscode.window.showInformationMessage('设置Token成功');
			}
		})
	);
}

function saveToken(token: string) {
	const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
	config.update('token', token, vscode.ConfigurationTarget.Global);
}



class ChatViewProvider implements vscode.WebviewViewProvider {
	public _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;
		console.log(webviewView.webview == this._view?.webview);

		// 设置 Webview 的 HTML 内容
		webviewView.webview.html = this.getWebviewContent(webviewView.webview);
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
        this._extensionUri
      ], // 允许访问其他本地资源，并定义加载本地内容的根 URI
		};
		// 处理 Webview 的消息和事件
		webviewView.webview.onDidReceiveMessage(async message => {
			console.log(message);
			// 处理来自 Webview 的消息
			if (message.type === 'message' || message.type === 'askQuestion') {
				const res = await callOpenAI(message.value);
				// vscode.window.showInformationMessage();
				// 处理收到的消息
				if(res) {
					console.log(res);
					const responseMessage = `${res.content}`;
					// 发送响应消息给 Webview
					webviewView?.webview.postMessage({ type: 'response', value: responseMessage });
				}
			}
		});
	}

	public postMessage(message: string) {
		// 处理 Webview 的消息和事件
		if (this._view) {
			this._view.webview?.postMessage({ type: 'askQuestion', value: message });
		}
	}

	private getWebviewContent(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
		const promptScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'prompt.json'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		const nonce = getNonce();
		return `
			<!DOCTYPE html>
			<html lang="en">
			<head>
  <meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link href="${styleResetUri}" rel="stylesheet">
	<link href="${styleVSCodeUri}" rel="stylesheet">
	<link href="${styleMainUri}" rel="stylesheet">
  <title>UsefulCode</title>
</head>
					<body>
							<div class="chat-container">
									<div class="chat-messages" id="chatMessages"></div>
									<div class="chat-input">
										<textarea placeholder="请输入你的问题，（输入'/'可以触发提示词）" class="messageInput" id="messageInput"></textarea>
										<button class="send-btn" id="sendButton">Send</button>
										<div class="position" id="position">
									  <span>角色</span>
									</div>
										</div>
							</div>
							<script nonce="${nonce}" src="${promptScriptUri}"></script>
							<script nonce="${nonce}" src="${scriptUri}"></script>
					</body>
					</html>
			`;
	}


}


function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}




// This method is called when your extension is deactivated
export function deactivate() { }



