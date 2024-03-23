import { loadPersona, createPersona, resetPersona } from './persona.js'
import { resetHistory, appendHistory, getHistory } from './history.js'
import { resamplePhoto, getPhoto } from './photo.js'
import { localTime } from "./utils.js"

const keyEntryPanel = document.getElementById('keyEntryPanel')
const noaKeyEntryBox = document.getElementById('noaKeyEntryBox')
const scenarioKeyEntryBox = document.getElementById('scenarioKeyEntryBox')
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
const submitButton = document.getElementById('submitButton')
const webSearchOptions = document.getElementById('web_search');
const serpApiImageModeOptions = document.getElementById('serpapi_image_mode');
const addressText = document.getElementById("address");
const clearButton = document.getElementById('clearButton')
// Keep persona section hidden (they are enabled at during setup)
personaQuestions.style.display = 'none'
personaResult.style.display = 'none'

window.onload = async function () {

    // Load config from JSON
    let configRaw = await fetch('./noa_config.json')
    let configJson = await configRaw.json()

    // Check if the keys have been entered
    await checkKeys(false)

    // Load the saved Noa if it exists
    let notFound = loadPersona(
        promptReadyUiCallback,
        imageReadyUiCallback
    )

    // Otherwise create a new Noa
    if (notFound) {
        try {

            await createPersona(
                configJson,
                questionUiCallback,
                promptReadyUiCallback,
                imageReadyUiCallback,
                localStorage.getItem("scenarioApiToken"))

        } catch (error) {

            // If we get an API key error, need to update keys and reload
            await checkKeys(true)
            location.reload()
        }
    }
}

async function checkKeys(force) {

    // Load the tokens if they exist
    let brilliantApiToken = localStorage.getItem("brilliantApiToken")
    let scenarioApiToken = localStorage.getItem("scenarioApiToken")

    // Nothing to do if the keys have been entered and not forcing new key entry
    if (brilliantApiToken && scenarioApiToken && force == false) {
        return
    }

    // Otherwise show the panel
    keyEntryPanel.style.display = 'flex'

    // Populate the boxes with the current keys if they exist
    noaKeyEntryBox.value = brilliantApiToken
    scenarioKeyEntryBox.value = scenarioApiToken

    // Wait for the user to submit the form
    await new Promise((resolve) => {

        // TODO don't resolve until both boxes are set
        keyEntryButton.addEventListener('click', resolve)
        noaKeyEntryBox.addEventListener('keydown', enterPressed)
        scenarioKeyEntryBox.addEventListener('keydown', enterPressed)

        // Allow 'Enter' from either of the boxes too
        function enterPressed(event) {
            if (event.key == "Enter") {
                resolve()
            }
        }
    })

    // Save the keys
    localStorage.setItem("brilliantApiToken", noaKeyEntryBox.value);
    localStorage.setItem("scenarioApiToken", scenarioKeyEntryBox.value);

    // Hide the panel
    keyEntryPanel.style.display = 'none'
}

async function questionUiCallback(question) {

    questionLabel.innerHTML = question.question

    // Clear any previous options in the dropdown menu
    for (let i = questionOptions.options.length - 1; i >= 0; i--) {
        questionOptions.remove(i)
    }

    // Populate dropdown with new options
    for (const i in question.options) {
        let option = document.createElement('option')
        option.value = question.options[i].option
        option.innerHTML = question.options[i].option
        questionOptions.appendChild(option)
    }

    // Clear the dropdown so the user can select something
    questionOptions.value = -1

    // Show the question UI
    personaQuestions.style.display = 'flex'
    personaResult.style.display = 'none'
    personaResetButton.hidden = true

    // Disable query entry
    textInput.disabled = true
    textInput.placeholder = "Create your Noa first"

    // Wait for a selection
    let option = await new Promise((resolve) => {
        questionOptions.addEventListener('change', (ev) => {
            resolve(ev.target.value)
        })
    })

    return option
}

async function promptReadyUiCallback(prompt) {

    // Hide the question UI
    personaQuestions.style.display = 'none'

    // Show Noa's personality
    personaResult.style.display = 'flex'
    personaText.innerHTML = prompt
    personaResetButton.hidden = false

    // Enable and clear the text areas
    textInput.disabled = false
    textInput.placeholder = "Ask me something"
    textInput.value = ""
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight

    // Reset the history
    resetHistory(prompt)
}

async function imageReadyUiCallback(images) {

    // Choose a random image from the saved images
    personaImage.src = images[Math.floor(Math.random() * images.length)];
}

personaResetButton.onclick = async function () {
    resetPersona()
    location.reload();
}

photoInput.onchange = function (event) {
    let reader = new FileReader()
    reader.readAsDataURL(event.target.files[0])
    reader.onload = function (event) {
        resamplePhoto(event.target.result)
        photoInput.value = ""
    }
}

submitButton.onclick = async function () {

    if (textInput.value == "") {
        return
    }

    const assistantConfig = {
        "search_api": webSearchOptions.value,
        "engine": serpApiImageModeOptions.value,    // ignored for every other search_api
    }

    const formData = new FormData()
    formData.append("prompt", textInput.value)
    formData.append("messages", JSON.stringify(getHistory()))
    formData.append("image", getPhoto())
    formData.append("experiment", "1")
    formData.append("config", JSON.stringify(assistantConfig))
    formData.append("local_time", localTime())
    formData.append("address", addressText.value)
    
    responseBox.value += "You: " + textInput.value + "\n\n"
    responseBox.scrollTop = responseBox.scrollHeight

    appendHistory("user", textInput.value)
    textInput.value = ""

    console.log(getHistory())

    try {
        // Get the Brilliant API url
        let configRaw = await fetch('./noa_config.json')
        let configJson = await configRaw.json()

        // Send the query to the chat API
        let response = await fetch(configJson.noa.apiUrl, {
            method: "POST",
            headers: {
                "Authorization": localStorage.getItem("brilliantApiToken")
            },
            body: formData
        })

        var json = await response.json()

    } catch (error) {
        checkKeys(true)
    }
    responseBox.value += `Noa: ${json.response} [${json.debug_tools} ${json.total_tokens} tokens used]\n\n`
    responseBox.scrollTop = responseBox.scrollHeight
    appendHistory("assistant", json.response)
}

textInput.onkeydown = function (event) {
    if (event.key == "Enter") {
        submitButton.click()
    }
}

clearButton.onclick = function () {
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight
    resetHistory(prompt)
}