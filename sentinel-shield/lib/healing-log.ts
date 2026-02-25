// Shared in-memory self-healing log — imported by both /api/self-healing and /api/chat
const healingLog: { time: string; action: string; target: string; severity: string; result: string }[] = [];

export function addSelfHealingAction(action: string, target: string, severity: string, result: string) {
    healingLog.unshift({ time: new Date().toISOString(), action, target, severity, result });
    if (healingLog.length > 50) healingLog.pop();
}

export function getSelfHealingLog() {
    return healingLog;
}
