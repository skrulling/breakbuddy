import * as vscode from 'vscode';

let timer: NodeJS.Timeout | null = null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting breakbuddy');

	// If a timer was previously set, and the end-time has not passed, start the timer
	const timerEnd = context.globalState.get<number>('timerEnd');
	if (timerEnd && Date.now() < timerEnd) {
		startTimer(context, timerEnd - Date.now());
	}

	let disposable = vscode.commands.registerCommand('breakbuddy.start', () => {
		vscode.window.showInformationMessage('Get programming bro. I\'ll remind you to take a break in 50 minutes 🔥');
		startTimer(context, 3000000); // 50 minutes
	});

	let stop = vscode.commands.registerCommand('breakbuddy.stop', () => {
		stopTimer(context);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(stop);
}

function startTimer(context: vscode.ExtensionContext, duration: number) {
	stopTimer(context);
	context.globalState.update('timerEnd', Date.now() + duration);
	timer = setTimeout(() => takeBreak(context), duration);
}

async function takeBreak(context: vscode.ExtensionContext) {
	vscode.window.showInformationMessage('Time to take a break there buddy 🙌 \nI suggest taking 10 minutes');
	const response = await vscode.window.showQuickPick(['$(debug-start) Back from my break 👌', '$(debug-stop) Done for today 🥱'], {title: 'BreakBuddy 🔥'});
	
	if(response === '$(debug-start) Back from my break 👌') {
		vscode.window.showInformationMessage('Nice! See you in 50 minutes 😎');
		startTimer(context, 3000000); // 50 minutes
	} else {
		stopTimer(context);
	}
}

function stopTimer(context: vscode.ExtensionContext) {
	if (timer) {
		clearTimeout(timer);
		timer = null;
		context.globalState.update('timerEnd', undefined);
		vscode.window.showInformationMessage('Stopping breakbuddy');
	}
}

export function deactivate() {
	// Don't need to call stopTimer here. When deactivating, VS Code will automatically stop all running timers.
}
