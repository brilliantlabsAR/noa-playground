export function loadPersona(config) {

    let personaPrompt = config.noa.baseRolePrompt
    let personaImage = "./img/unknown_noa.png"
    let personaComplete = false

    if (localStorage.getItem("personaPrompt") != null) {
        personaPrompt += ` ${localStorage.getItem("personaPrompt")}`
        // personaImage = localStorage.getItem("personaImage") // TODO
        personaComplete = true
    }

    return { personaPrompt, personaImage, personaComplete }
}

let questionNumber = -1

export function getNextPersonaQuestion(questionList) {

    questionNumber++

    if (questionList[questionNumber] != null) {
        let question = questionList[questionNumber].question
        let options = questionList[questionNumber].options
        return { question, options }
    }

    return null
}

let tempPersonaPrompt = ""
let tempPersonaSpritePrompt = ""

export function savePersona(questionList, chosenOption) {

    for (const optionNumber in questionList[questionNumber].options) {
        if (questionList[questionNumber].options[optionNumber].option ==
            chosenOption) {
            tempPersonaPrompt += ` ${questionList[questionNumber].options[optionNumber].roleAspect} `
            tempPersonaSpritePrompt += ` ${questionList[questionNumber].options[optionNumber].spriteAspect} `
        }
    }

    if (questionList.length - 1 == questionNumber) {
        localStorage.setItem("personaPrompt", tempPersonaPrompt)
    }

    // TODO generate and save image
}


export function deleteSavedPersona() {
    localStorage.removeItem("personaPrompt")
    questionNumber = -1
}