import * as vscode from 'vscode';

export class Statistics {
    totalWorkTime: number;
    totalBreakTime: number;
    breakCount: number;
    dailyWorkTime: number;
    date: string;

    constructor() {
        this.totalWorkTime = 0;
        this.totalBreakTime = 0;
        this.breakCount = 0;
        this.dailyWorkTime = 0;
        this.date = new Date().toLocaleDateString(); // Initialize with current date
    }
}

export class StatisticsManager {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    load(): Statistics {
        const stats = this.context.globalState.get<Statistics>('statistics', new Statistics());
        const currentDate = new Date().toLocaleDateString();
        if (stats.date !== currentDate) {
            stats.date = currentDate;
            stats.dailyWorkTime = 0;
        }
        return stats;
    }

    save(stats: Statistics) {
        this.context.globalState.update('statistics', stats);
    }
}

