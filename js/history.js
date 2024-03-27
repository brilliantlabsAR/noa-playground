let history = []

export function resetHistory() {
    resetImages("image_input")
    resetImages("image_output")
    history = []
}
export function setSystemMessage(systemMessage) {
    if (history.length == 0 || history[0]["role"] != "system") {
        // Need to insert a system message at the beginning
        history.unshift({ "role": "system", "content": "" })
    }
    history[0]["content"] = systemMessage
}
export function resetImages(id) {
    const canvas = document.getElementById(id);
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d");

    ctx.rect(0, 0, 512, 512);
    ctx.fillStyle = "black";
    ctx.fill();

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