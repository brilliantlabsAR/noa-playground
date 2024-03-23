let history = []

export function resetHistory(initialPrompt) {
    resetImages("image_input")
    resetImages("image_output")
    history = [{
        "role": "system",
        "content": initialPrompt
    }]
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