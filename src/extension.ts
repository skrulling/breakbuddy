import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting breakbuddy');
	let disposable = vscode.commands.registerCommand('breakbuddy.start', () => {
		vscode.window.showInformationMessage('Get programming bro. I\'ll remind you to take a break in 50 minutes 🔥');
		letsWork();
	});

	let stop = vscode.commands.registerCommand('breakbuddy.stop', () => {
		deactivate();
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(stop);
}

function letsWork() {
	setTimeout(async () => {
		vscode.window.showInformationMessage('Time to take a break there buddy 🙌 \nI suggest taking 10 minutes');
		const response = await vscode.window.showQuickPick(['$(debug-start) Back from my break 👌', '$(debug-stop) Done for today 🥱'], {title: 'BreakBuddy 🔥'});

		if(response === 'Back from my break 👌') {
			vscode.window.showInformationMessage('Nice! See you in 50 minutes 😎');
			letsWork();
		} else {
			deactivate();
		}
	}, 3000000); // 3 000 000 ms is 50 minutes
}

export function deactivate() {
	vscode.window.showInformationMessage('Stopping breakbuddy');
}
