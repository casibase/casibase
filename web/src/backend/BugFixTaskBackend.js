import * as Setting from "../Setting";

export function getCurrentBugFix() {
    return fetch(`${Setting.ServerUrl}/api/bugfix/get-current-bug-fix`, {
        method: "GET",
        credentials: "include",
    }).then(res => res.json());
}

export function stopBugFix() {
    return fetch(`${Setting.ServerUrl}/api/bugfix/stop-bug-fix`, {
        method: "POST",
        credentials: "include",
    }).then(res => res.json());
}

export function createBugFix(taskType, params) {
    return fetch(`${Setting.ServerUrl}/api/bugfix/create-bug-fix`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ taskType, params }),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json());
}
