const photoInput = document.getElementById('photoInput')
const textInput = document.getElementById('textInput')
const submitButton = document.getElementById('submitButton')
const responseBox = document.getElementById('responseBox')
const keyEntryPanel = document.getElementById('keyEntryPanel')
const keyEntryBox = document.getElementById('keyEntryBox')
const keyEntryButton = document.getElementById('keyEntryButton')

const apiURL = "https://api.brilliant.xyz/dev/noa/mm"
var apiToken = localStorage.getItem("apiToken")

if (apiToken == null) {
    keyEntryPanel.style.display = 'flex'
}

const basePrompt =
    `You are a smart assistant named Noa that answers all user queries, 
    questions, and statements with a single sentence. You exist inside AR smart 
    glasses the user is wearing. The camera is unfortunately VERY low quality
    but the user is counting on you to interpret the blurry, pixelated images.
    NEVER comment on image quality. Do your best with images. Always respond
    like Ali G.`

var history = [{
    "role": "system",
    "content": basePrompt
}]

keyEntryButton.addEventListener('click', () => {
    apiToken = keyEntryBox.value
    localStorage.setItem("apiToken", keyEntryBox.value);
    keyEntryPanel.style.display = 'none'
})

submitButton.addEventListener('click', () => {

    if (textInput.value == "") {
        return
    }

    const formData = new FormData()
    formData.append("prompt", textInput.value)
    formData.append("messages", JSON.stringify(history))
    // formData.append("image", ...) // TODO

    responseBox.value += "You: " + textInput.value + "\n\n"
    responseBox.scrollTop = responseBox.scrollHeight
    textInput.value = ""

    history.push({
        "role": "user",
        "content": textInput.value
    })

    fetch(apiURL, {
        method: "POST",
        headers: {
            "Authorization": apiToken
        },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response}`);
            }
            return response.json();
        })
        .then(data => {
            responseBox.value += "Noa: " + data.response + "\n\n"
            responseBox.scrollTop = responseBox.scrollHeight

            history.push({
                "role": "assistant",
                "content": data.response
            })
        })
        .catch(error => {
            responseBox.value += "Error: " + error + "\n\n"
            responseBox.scrollTop = responseBox.scrollHeight
            keyEntryPanel.style.display = 'flex'
            keyEntryBox.value = localStorage.getItem("apiToken")
        });
})