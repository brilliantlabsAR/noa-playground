import { clearHistory, appendHistory, getHistory } from './history.js'
import { resamplePhoto, getPhoto } from './photo.js'
import { loadPersona, getNextPersonaQuestion, savePersona, deleteSavedPersona } from './persona.js'

const keyEntryPanel = document.getElementById('keyEntryPanel')
const keyEntryBox = document.getElementById('keyEntryBox')
const keyEntryButton = document.getElementById('keyEntryButton')
const personaQuestions = document.getElementById('personaQuestions')
const personaResult = document.getElementById('personaResult')
const personaImage = document.getElementById('personaImage')
const personaResetButton = document.getElementById('personaResetButton')
const questionLabel = document.getElementById('questionLabel')
const questionOptions = document.getElementById('questionOptions')
const personaText = document.getElementById('personaText')
const responseBox = document.getElementById('responseBox')
const textInput = document.getElementById('textInput')
const photoInput = document.getElementById('photoInput')
const clearButton = document.getElementById('clearButton')
const submitButton = document.getElementById('submitButton')

personaQuestions.style.display = 'none'
personaResult.style.display = 'none'

let config = {}
fetch('./noa_config.json')
    .then((response) => response.json())
    .then((json) => {
        config = json
        setupPersona(config)
    })

let apiToken = localStorage.getItem("apiToken")
if (apiToken == null) {
    keyEntryPanel.style.display = 'flex' // Show key entry panel
}

function setupPersona(config) {

    let persona = loadPersona(config)

    textInput.value = ""
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight

    clearHistory(persona.personaPrompt)
    personaImage.src = persona.personaImage

    if (persona.personaComplete) {
        personaQuestions.style.display = 'none'
        personaResult.style.display = 'flex'
        personaText.innerHTML = persona.personaPrompt
        personaResetButton.hidden = false
        textInput.disabled = false
        textInput.placeholder = "Ask me something"
        return
    }
    personaQuestions.style.display = 'flex'
    personaResult.style.display = 'none'
    personaResetButton.hidden = true
    textInput.disabled = true
    textInput.placeholder = "Create your Noa first"

    let question = getNextPersonaQuestion(config.noa.questions)

    questionLabel.innerHTML = question.question

    for (let i = questionOptions.options.length - 1; i >= 0; i--) {
        questionOptions.remove(i)
    }

    for (const i in question.options) {
        let option = document.createElement('option')
        option.value = question.options[i].option
        option.innerHTML = question.options[i].option
        questionOptions.appendChild(option)
    }

    questionOptions.value = -1
}

personaResetButton.onclick = function () {
    deleteSavedPersona()
    setupPersona(config)
}

questionOptions.onchange = function (event) {
    savePersona(config.noa.questions, event.target.value)
    setupPersona(config)
}

keyEntryButton.onclick = function () {
    apiToken = keyEntryBox.value
    localStorage.setItem("apiToken", keyEntryBox.value);
    keyEntryPanel.style.display = 'none'
}

keyEntryBox.onkeydown = function (event) {
    if (event.key == "Enter") {
        keyEntryButton.click()
    }
}

photoInput.onchange = function (event) {
    let reader = new FileReader()
    reader.readAsDataURL(event.target.files[0])
    reader.onload = function (event) {
        resamplePhoto(event.target.result)
    }
}

submitButton.onclick = function () {

    if (textInput.value == "") {
        return
    }

    const formData = new FormData()
    formData.append("prompt", textInput.value)
    formData.append("messages", JSON.stringify(getHistory()))
    formData.append("image", getPhoto())

    responseBox.value += "You: " + textInput.value + "\n\n"
    responseBox.scrollTop = responseBox.scrollHeight
    textInput.value = ""

    appendHistory("user", textInput.value)

    fetch(config.api.url, {
        method: "POST",
        headers: { "Authorization": apiToken },
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response}`);
            }
            return response.json();
        })
        .then(data => {
            responseBox.value += `Noa: ${data.response} [${data.debug_tools} ${data.total_tokens} tokens used]\n\n`
            responseBox.scrollTop = responseBox.scrollHeight
            appendHistory("assistant", data.response)
        })
        .catch(error => {
            responseBox.value += "Error: " + error + "\n\n"
            responseBox.scrollTop = responseBox.scrollHeight
            keyEntryPanel.style.display = 'flex'
            keyEntryBox.value = localStorage.getItem("apiToken")
        });
}

textInput.onkeydown = function (event) {
    console.log("Event")
    if (event.key == "Enter") {
        submitButton.click()
    }
}

clearButton.onclick = function () {
    setupPersona(config)
}