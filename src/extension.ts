// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Starting breakbuddy');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('breakbuddy.start', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Get programming bro. I\'ll remind you to take a break in 50 minutes 🔥');
		letsWork();
	});

	context.subscriptions.push(disposable);
}

function letsWork() {
	setTimeout(async () => {
		vscode.window.showInformationMessage('Time to take a break there buddy 🙌 \nI suggest taking 10 minutes');
		const response = await vscode.window.showQuickPick(['Back from my break 👌', 'Done for today 🥱'], {title: 'BreakBuddy 🔥'});

		if(response === 'Back from my break 👌') {
			vscode.window.showInformationMessage('Nice! See you in 50 minutes 😎');
			letsWork();
		} else {
			deactivate();
		}
	}, 3000000); // 3 000 000 ms is 50 minutes

}

// This method is called when your extension is deactivated
export function deactivate() {}
