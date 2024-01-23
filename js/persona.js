export function loadPersona(
    promptReadyCallback,
    imagesReadyCallback) {

    let prompt = localStorage.getItem("personaPrompt")
    let images = JSON.parse(localStorage.getItem("personaImages"))

    if (prompt && images) {
        promptReadyCallback(prompt)
        imagesReadyCallback(images)
        return false
    }

    // If no saved persona found
    return true
}

export async function createPersona(
    config,
    questionCallback,
    promptReadyCallback,
    imagesReadyCallback,
    scenarioApiKey) {

    let prompt = config.noa.basePrompt
    let imagePrompt = config.noa.baseImagePrompt

    for (let questionNumber in config.noa.questions) {

        let option = await questionCallback(config.noa.questions[questionNumber])

        // Find the option in the questions list
        for (const optionNumber in config.noa.questions[questionNumber].options) {
            if (config.noa.questions[questionNumber].options[optionNumber].option ==
                option) {
                prompt += ` ${config.noa.questions[questionNumber].options[optionNumber].roleAspect} `
                imagePrompt += ` ${config.noa.questions[questionNumber].options[optionNumber].spriteAspect} `
            }
        }
    }

    localStorage.setItem("personaPrompt", prompt)
    promptReadyCallback(prompt)

    // Start the image generation
    let inference = await startImageGeneration(config, imagePrompt, scenarioApiKey)

    // This will trigger the callback when it's done
    waitForImages(config, inference, imagesReadyCallback, scenarioApiKey)
}

export function resetPersona() {
    localStorage.removeItem("personaPrompt")
    localStorage.removeItem("personaImages")
}

async function startImageGeneration(
    config,
    prompt,
    apiKey) {

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: `Basic ${apiKey}`
        },
        body: JSON.stringify({
            parameters: {
                qualityBoost: false,
                type: 'txt2img',
                disableMerging: false,
                hideResults: false,
                referenceAdain: false,
                intermediateImages: false,
                referenceAttn: false,
                seed: config.scenario.seed,
                negativePrompt: config.scenario.negativePrompt,
                guidance: config.scenario.guidance,
                prompt: prompt
            }
        })
    };

    let response = await fetch(
        `${config.scenario.apiUrl}/${config.scenario.model}/inferences`, options
    )

    if (response.status != 200) {
        throw (response.status)
    }

    let json = await response.json()

    console.log(json)

    return json.inference
}

async function waitForImages(config, inference, imagesReadyCallback, apiKey) {

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${apiKey}`
        }
    };

    while (true) {

        // Every 3 seconds
        await new Promise(r => setTimeout(r, 3000));

        // Poll the API to see if the images are ready
        let response = await fetch(
            `${config.scenario.apiUrl}/${config.scenario.model}/inferences/${inference.id}`, options
        )
        let json = await response.json()

        console.log(json)

        // When complete, save the images and call the callback handler
        if (json.inference.status == 'succeeded') {

            let images = []

            for (let imageNumber in json.inference.images) {
                images.push(json.inference.images[imageNumber].url)
            }

            localStorage.setItem("personaImages", JSON.stringify(images))
            imagesReadyCallback(images)
            return
        }

        // If failed, throw an error
        if (json.inference.status == 'failed') {
            throw ("Image generation failed")
        }
    }
}