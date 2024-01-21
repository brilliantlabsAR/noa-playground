const photoInput = document.getElementById('photoInput')
const textInput = document.getElementById('textInput')
const submitButton = document.getElementById('submitButton')
const clearButton = document.getElementById('clearButton')
const responseBox = document.getElementById('responseBox')
const keyEntryPanel = document.getElementById('keyEntryPanel')
const keyEntryBox = document.getElementById('keyEntryBox')
const keyEntryButton = document.getElementById('keyEntryButton')

var apiToken = localStorage.getItem("apiToken")
var imageFile = null;

// Load config
var config = {}
fetch('./noa_config.json')
    .then((response) => response.json())
    .then((json) => config = json);

// If an API token isn't set, open the token prompt
if (apiToken == null) {
    keyEntryPanel.style.display = 'flex'
}

// TODO build this dynamically from the options
const characterPrompt =
    `Always respond like Ali G`

// Keep a running history of the conversion
var history = [{
    "role": "system",
    "content": config.basePrompt + " " + characterPrompt
}]

// Button handler to update the API key and hide the prompt
keyEntryButton.addEventListener('click', () => {
    apiToken = keyEntryBox.value
    localStorage.setItem("apiToken", keyEntryBox.value);
    keyEntryPanel.style.display = 'none'
})

// Stores and scales the captured or opened image
window.openImage = function (file) {

    var input = file.target;
    var reader = new FileReader();
    reader.onload = function (e) {

        // Open the file as an image
        var image = document.createElement("img")
        image.onload = function () {

            // Use canvas to resize and adjust the image
            var canvas = document.createElement("canvas")
            var ctx = canvas.getContext("2d")
            ctx.drawImage(image, 0, 0, 200, 200)
            // TODO properly crop and change color settings

            // Attach the image into the form data
            formData.append("image", canvas.toDataURL())
        }
        image.src = e.target.result;
    }
    reader.readAsDataURL(input.files[0]);
}

// Button handler for sending prompts to the server
submitButton.addEventListener('click', () => {

    // Don't do anything if no text is given
    if (textInput.value == "") {
        return
    }

    // Build the prompt payload
    const formData = new FormData()
    formData.append("prompt", textInput.value)
    formData.append("messages", JSON.stringify(history))

    // Include an image if one is available
    if (imageFile != null) {
        formData.append("image", imageFile)
    }
    imageFile != null

    // Update the response output box
    responseBox.value += "You: " + textInput.value + "\n\n"
    responseBox.scrollTop = responseBox.scrollHeight
    textInput.value = ""

    // Update history
    history.push({
        "role": "user",
        "content": textInput.value
    })

    // Post data to Noa API
    fetch(config.apiUrl, {
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

// Button handler for the clear button
clearButton.addEventListener('click', () => {

    // Clear the response output box
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight

    // Reset history
    history = [{
        "role": "system",
        "content": config.basePrompt + " " + characterPrompt
    }]
})