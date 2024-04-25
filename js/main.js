import { loadPersona, createPersona, resetPersona } from './persona.js'
import { resetHistory, setSystemMessage, appendHistory, getHistory, resetImages } from './history.js'
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
const assistantSelection = document.getElementById("assistantSelection");
const visionModel = document.getElementById('visionModel')
const generateImage = document.getElementById('generateImage')
const systemMessageText = document.getElementById('systemMessage')
const useCustomSystemMessage = document.getElementById("useCustomSystemMessage")
const wildCard = document.getElementById("wild_card")
// Keep persona section hidden (they are enabled at during setup)
personaQuestions.style.display = 'none'
personaResult.style.display = 'none'

window.onload = async function () {

    // Load config from JSON
    let configRaw = await fetch('./noa_config.json')
    let configJson = await configRaw.json()

    // Check if the keys have been entered
    await checkKeys(false)
    promptReadyUiCallback()
    if (localStorage.getItem("wildCard") == "1") {
        wildCard.checked = true
        startRandomPings()
    }
}

async function checkKeys(force) {

    // Load the tokens if they exist
    let brilliantApiToken = localStorage.getItem("brilliantApiToken")
    // let scenarioApiToken = localStorage.getItem("scenarioApiToken")

    // Nothing to do if the keys have been entered and not forcing new key entry
    // if (brilliantApiToken && scenarioApiToken && force == false) {
    if (brilliantApiToken  && force == false) {
        return
    }

    // Otherwise show the panel
    keyEntryPanel.style.display = 'flex'

    // Populate the boxes with the current keys if they exist
    noaKeyEntryBox.value = brilliantApiToken
    // scenarioKeyEntryBox.value = scenarioApiToken

    // Wait for the user to submit the form
    await new Promise((resolve) => {

        // TODO don't resolve until both boxes are set
        keyEntryButton.addEventListener('click', resolve)
        noaKeyEntryBox.addEventListener('keydown', enterPressed)
        // scenarioKeyEntryBox.addEventListener('keydown', enterPressed)

        // Allow 'Enter' from either of the boxes too
        function enterPressed(event) {
            if (event.key == "Enter") {
                resolve()
            }
        }
    })

    // Save the keys
    localStorage.setItem("brilliantApiToken", noaKeyEntryBox.value);
    // localStorage.setItem("scenarioApiToken", scenarioKeyEntryBox.value);

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

async function promptReadyUiCallback() {

    // Hide the question UI
    personaQuestions.style.display = 'none'

    // Show Noa's personality
    personaResult.style.display = 'flex'
    personaText.innerHTML = ""
    personaResetButton.hidden = false

    // Enable and clear the text areas
    textInput.disabled = false
    textInput.placeholder = "Ask me something"
    textInput.value = ""
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight

    // Reset the history
    resetHistory()
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

async function callAPI(formData) {
    let configRaw = await fetch('./noa_config.json')
    let configJson = await configRaw.json()

    let response = await fetch(configJson.noa.apiUrl, {
        method: "POST",
        headers: {
            "Authorization": localStorage.getItem("brilliantApiToken")
        },
        body: formData
    })

    return await response.json()
}
submitButton.onclick = async function () {

    if (textInput.value == "") {
        return
    }
    let assistant = assistantSelection.value
    let vision_model = visionModel.value
    let generate_image = generateImage.checked
    const assistantConfig = {
        "search_api": webSearchOptions.value,
        "engine": serpApiImageModeOptions.value,    // ignored for every other search_api
    }
    if (assistant) {
        assistantConfig["assistant"] = assistant
    }
    if (vision_model) {
        assistantConfig["vision"] = vision_model
    }
    if (generate_image) {
        assistantConfig["generate_image"] = 1
    }

    if (useCustomSystemMessage.checked) {
        setSystemMessage(systemMessageText.value)
    }

    const formData = new FormData()
    formData.append("prompt", textInput.value)
    formData.append("messages", JSON.stringify(getHistory()))
    let photo_sent = getPhoto()
    if (photo_sent) {
        formData.append("image", photo_sent)
    }else{
        resetImages("image_input")
    }
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
        var json = await callAPI(formData)
        if (json.error) {
            throw json.error
        }

    } catch (error) {
        checkKeys(true)
    }
    responseBox.value += `Noa: ${json.response} [${json.debug_tools} ${json.total_tokens} tokens used]\n\n`
    let imageOutput = json.image
     // image is base64 encoded
    if (imageOutput) {
        imageOutput = "data:image/png;base64," + imageOutput
        drawOutputImage(imageOutput)
    }
    responseBox.scrollTop = responseBox.scrollHeight
    appendHistory("assistant", json.response)
}
var random_time = 0
const SYSTEM_MESSAGE_LIST = [
    "Based on current date check something important in history for the date then inform user in engaging way and also ask user about his/her opinion, keep messages short(max 3-4 sentences) and don't mention terms like the 'serch result ...' or 'I found ...'",
    "look for an upcoming event in the user's area and inform the user about it  in engaging way and also ask if they are interested in attending, keep messages short(max 3-4 sentences) and don't mention terms like the 'serch result ...' or 'I found ...'",
    "look for a popular movie in the user's area and inform the user about it  in engaging way and also ask if they are interested in watching it, keep messages short(max 3-4 sentences) and don't mention terms like the 'serch result ...' or 'I found ...'",
]
var currentPing=null
function startRandomPings() {
    currentPing = setTimeout(async function () {
        let formData = new FormData()
        let _systemMessage = {
            "role": "system",
            "content": SYSTEM_MESSAGE_LIST[Math.floor(Math.random() * SYSTEM_MESSAGE_LIST.length)]
        }
        formData.append("prompt", "hi")
        formData.append("messages", JSON.stringify([_systemMessage]))
        formData.append("experiment", "1")
        formData.append("config", JSON.stringify({}))
        formData.append("local_time", localTime())
        formData.append("address", addressText.value)
        appendHistory("user", "hi")

        let json = await callAPI(formData)
        if (json.error) {
            throw json.error
        }
        responseBox.value += `Noa: ${json.response} [${json.debug_tools} ${json.total_tokens} tokens used]\n\n`
        appendHistory("assistant", json.response)
        random_time = Math.floor(Math.random() * 10000) + 300000
        if(localStorage.getItem("wildCard") == "1"){
            startRandomPings()
        }
    }, random_time)
}
function drawOutputImage(image) {
    const canvas = document.getElementById("image_output")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    img.onload = function () {
        ctx.drawImage(img, 0, 0, 512, 512)
    }
    img.src = image
}
wildCard.onclick = function () {
    if (wildCard.checked) {
    localStorage.setItem("wildCard", "1")
    try{
        clearTimeout(currentPing)
    }catch(e){}
        random_time =0
        startRandomPings()
    }else{
        localStorage.removeItem("wildCard")
    }
}
textInput.onkeydown = function (event) {
    if (event.key == "Enter") {
        submitButton.click()
    }
}

clearButton.onclick = function () {
    responseBox.value = ""
    responseBox.scrollTop = responseBox.scrollHeight
    resetHistory()
}
useCustomSystemMessage.onchange = function () {
    if (useCustomSystemMessage.checked){
        systemMessageText.classList.remove("collapsed")
    }else{
        systemMessageText.classList.add("collapsed")
    }
}