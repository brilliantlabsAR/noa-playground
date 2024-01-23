let history = []

export function resetHistory(initialPrompt) {
    history = [{
        "role": "system",
        "content": initialPrompt
    }]
}

export function appendHistory(role, text) {
    history.push({
        "role": role,
        "content": text
    })
}

export function getHistory() {
    return history
}