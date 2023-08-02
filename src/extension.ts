import * as vscode from 'vscode';
import { Statistics, StatisticsManager } from './statistics';

let timer: NodeJS.Timeout | null = null;
let pomodoroCount = 0;
let statusBar: vscode.StatusBarItem;
let statsManager: StatisticsManager;
let stats: Statistics;


export function activate(context: vscode.ExtensionContext) {
	console.log('Starting breakbuddy');

	statsManager = new StatisticsManager(context);
	stats = statsManager.load();

	statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
	context.subscriptions.push(statusBar);

	// If a timer was previously set, and the end-time has not passed, start the timer
	const timerEnd = context.globalState.get<number>('timerEnd');
	const mode = context.globalState.get<string>('mode');
	if (timerEnd && Date.now() < timerEnd) {
		if (mode === 'pomodoro') {
			startPomodoroTimer(context, timerEnd - Date.now());
		} else {
			startTimer(context, timerEnd - Date.now());
		}
	}

	let disposable = vscode.commands.registerCommand('breakbuddy.start', () => {
		vscode.window.showInformationMessage('Get programming bro. I\'ll remind you to take a break in 50 minutes 🔥');
		context.globalState.update('mode', 'normal');
		startTimer(context, 3000000); // 50 minutes
		// startTimer(context, 2000); // 50 minutes
	});

	let stop = vscode.commands.registerCommand('breakbuddy.stop', () => {
		stopTimer(context);
	});

	let pomodoro = vscode.commands.registerCommand('breakbuddy.pomodoroStart', () => {
		vscode.window.showInformationMessage('Pomodoro Mode! Let\'s get to work! 🔥\n Next break in 25 minutes');
		context.globalState.update('mode', 'pomodoro');
		pomodoroCount = 0;
		startPomodoroTimer(context, 1500000, false); // 25 minutes
		// startPomodoroTimer(context, 3000, false); // 25 minutes
	});

	let showStats = vscode.commands.registerCommand('breakbuddy.showStats', () => {
		// Formatting and displaying the stats
		const workTimeMinutes = Math.floor(stats.totalWorkTime / 60000);
		const workTimeHours = Math.floor(workTimeMinutes / 60);
		const breakTimeMinutes = Math.floor(stats.totalBreakTime / 60000);
		const breakTimeHours = Math.floor(breakTimeMinutes / 60);
		const breakCount = stats.breakCount;
		const dailyWorkTimeMinutes = Math.floor(stats.dailyWorkTime / 60000);
		const dailyWorkTimeHours = Math.floor(dailyWorkTimeMinutes / 60);

		let statsToShow = `🔥 BreakBuddy Statistics 🔥\n
        Total work time: ${workTimeHours} hours and ${workTimeMinutes % 60} minutes\n
        Today's work time: ${dailyWorkTimeHours} hours and ${dailyWorkTimeMinutes % 60} minutes\n
        Total break time: ${breakTimeHours} hours and ${breakTimeMinutes % 60} minutes\n
        Number of breaks taken: ${breakCount}\n`;

		vscode.window.showInformationMessage(statsToShow);
	});

	context.subscriptions.push(showStats);


	context.subscriptions.push(disposable);
	context.subscriptions.push(stop);
	context.subscriptions.push(pomodoro);
}

function startTimer(context: vscode.ExtensionContext, duration: number) {
	stopTimer(context, false); // Don't show the "Stopping breakbuddy" message when starting a new timer
	context.globalState.update('timerEnd', Date.now() + duration);
	context.globalState.update('timerStart', Date.now());
	timer = setTimeout(() => takeBreak(context), duration);
	stats.totalWorkTime += duration;
	stats.dailyWorkTime += duration;
	statsManager.save(stats);
}

// This will be a new function dedicated to Pomodoro mode
function startPomodoroTimer(context: vscode.ExtensionContext, duration: number, isBreak: boolean = false) {
	stopTimer(context, false);
	context.globalState.update('timerEnd', Date.now() + duration);
	context.globalState.update('timerStart', Date.now());
	if (isBreak) {
		stats.totalBreakTime += duration;
		stats.breakCount += 1;
		const timeLeft = duration;
		const minutes = Math.floor(timeLeft / 60000);
		const seconds = Math.floor((timeLeft % 60000) / 1000);
		statusBar.text = `BreakBuddy: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // Initial countdown display
		statusBar.show();
		timer = setInterval(() => {
			const timeLeft = (context.globalState.get<number>('timerEnd') as number) - Date.now();
			if (timeLeft <= 0) {
				statusBar.hide();
				clearInterval(timer as NodeJS.Timeout);
				takePomodoroBreak(context, isBreak);
			} else {
				const minutes = Math.floor(timeLeft / 60000);
				const seconds = Math.floor((timeLeft % 60000) / 1000);
				statusBar.text = `BreakBuddy: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
			}
		}, 1000);
	} else {
		stats.totalWorkTime += duration;
		stats.dailyWorkTime += duration;
		timer = setTimeout(() => takePomodoroBreak(context, isBreak), duration);
	}
	statsManager.save(stats);
}

// This function will handle the breaks in Pomodoro mode
async function takePomodoroBreak(context: vscode.ExtensionContext, isBreak: boolean) {
	const duration = Date.now() - (context.globalState.get<number>('timerStart') as number);
	if (isBreak) {
		stats.totalBreakTime += duration;
		stats.breakCount += 1;
	} else {
		stats.totalWorkTime += duration;
	}
	statsManager.save(stats);

	if (!isBreak) {
		pomodoroCount++;
		let message = 'Time to take a ';
		message += pomodoroCount % 4 === 0 ? 'long break 🏖️' : 'short break 🙌';
		vscode.window.showInformationMessage(message);
		startPomodoroTimer(context, pomodoroCount % 4 === 0 ? 900000 : 300000, true); // 15 minutes and 5 minutes
		// startPomodoroTimer(context, pomodoroCount % 4 === 0 ? 9000 : 3000, true); // 15 minutes and 5 minutes
	} else {
		const response = await vscode.window.showQuickPick(['$(debug-start) Back to work 👌', '$(debug-stop) Done for today 🥱'], { title: 'BreakBuddy 🔥' });
		if (response === '$(debug-start) Back to work 👌') {
			vscode.window.showInformationMessage('Nice! See you in 25 minutes 😎');
			startPomodoroTimer(context, 1500000, false); // 25 minutes
			// startPomodoroTimer(context, 1500, false); // 25 minutes
		} else {
			stopTimer(context);
		}
	}
}

async function takeBreak(context: vscode.ExtensionContext) {
	const duration = Date.now() - (context.globalState.get<number>('timerStart') as number);
	stats.totalWorkTime += duration;
	statsManager.save(stats);
	// Break time is over
	const response = await vscode.window.showQuickPick(['$(debug-start) Back to work 👌', '$(debug-stop) Done for today 🥱'], { title: 'BreakBuddy 🔥' });
	if (response === '$(debug-start) Back to work 👌') {
		vscode.window.showInformationMessage('Nice! See you in 50 minutes 😎');
		startTimer(context, 3000000); // 50 minutes
	} else {
		stopTimer(context);
	}
}

function stopTimer(context: vscode.ExtensionContext, showMessage: boolean = true) {
	const duration = Date.now() - (context.globalState.get<number>('timerStart') as number);
	if (timer) {
		clearTimeout(timer);
		timer = null;
		context.globalState.update('timerEnd', undefined);
		context.globalState.update('timerStart', undefined);
		stats.totalWorkTime += duration;
		statsManager.save(stats);
		if (showMessage) {
			vscode.window.showInformationMessage('Nice work today buddster 💎 Stopping breakbuddy..');
			displayStats(stats);
		}
	}
}

function displayStats(stats: Statistics) {
	const workTimeMinutes = Math.floor(stats.totalWorkTime / 60000);
	const workTimeHours = Math.floor(workTimeMinutes / 60);
	const breakTimeMinutes = Math.floor(stats.totalBreakTime / 60000);
	const breakTimeHours = Math.floor(breakTimeMinutes / 60);
	const dailyWorkTimeMinutes = Math.floor(stats.dailyWorkTime / 60000);
	const dailyWorkTimeHours = Math.floor(dailyWorkTimeMinutes / 60);

	vscode.window.showInformationMessage(`Total work time: ${workTimeHours} hours and ${workTimeMinutes % 60} minutes\n` +
		`Today's work time: ${dailyWorkTimeHours} hours and ${dailyWorkTimeMinutes % 60} minutes\n` +
		`Total break time: ${breakTimeHours} hours and ${breakTimeMinutes % 60} minutes\n` +
		`Number of breaks: ${stats.breakCount}`);
}


export function deactivate() {
	// Don't need to call stopTimer here. When deactivating, VS Code will automatically stop all running timers.
	statusBar.dispose();
}
