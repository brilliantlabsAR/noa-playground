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

    // Generate a common random seed for all images
    let seed = Math.floor(Math.random() * 1000000)

    // Start the image generation, one for each pose
    let inference = []
    for (let poseNum in config.scenario.pose) {
        inference[poseNum] = await startImageGeneration(
            config,
            imagePrompt,
            scenarioApiKey,
            seed,
            config.scenario.pose[poseNum])
    }

    // Wait for all assets to be generated
    let assets = []
    for (let poseNum in config.scenario.pose) {
        assets.push(await waitForAsset(config, inference[poseNum], scenarioApiKey))
    }

    // Remove backgrounds
    let images = []
    for (let poseNum in config.scenario.pose) {
        images.push(await removeBackground(config, assets[poseNum], scenarioApiKey))
    }

    // Save images and issue callback
    localStorage.setItem("personaImages", JSON.stringify(images))
    imagesReadyCallback(images)
}

export function resetPersona() {
    localStorage.removeItem("personaPrompt")
    localStorage.removeItem("personaImages")
}

async function startImageGeneration(
    config,
    prompt,
    apiKey,
    seed,
    style) {

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: `Basic ${apiKey}`
        },
        body: JSON.stringify({
            parameters: {
                prompt: prompt + style,
                negativePrompt: config.scenario.negativePrompt,
                guidance: config.scenario.guidance,
                height: config.scenario.height,
                width: config.scenario.width,
                seed: seed,
                numInferenceSteps: config.scenario.numInferenceSteps,
                numSamples: 1,
                hideResults: false,
                intermediateImages: false,
                qualityBoost: false,
                type: 'txt2img',
            }
        })
    };

    let response = await fetch(
        `${config.scenario.apiUrl}/models/${config.scenario.model}/inferences`, options
    )

    if (response.status != 200) {
        throw (response.status)
    }

    let json = await response.json()

    return json.inference
}

async function waitForAsset(config, inference, apiKey) {

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Basic ${apiKey}`
        }
    };

    while (true) {

        // Every 1 second
        await new Promise(r => setTimeout(r, 1000));

        // Poll the API to see if the images are ready
        let response = await fetch(
            `${config.scenario.apiUrl}/models/${config.scenario.model}/inferences/${inference.id}`, options
        )
        let json = await response.json()

        // When complete, save the images and call the callback handler
        if (json.inference.status == 'succeeded') {
            return json.inference.images[0].id
        }

        // If failed, throw an error
        if (json.inference.status == 'failed') {
            throw ("Image generation failed")
        }
    }
}

async function removeBackground(config, asset, apiKey) {

    const options = {
        method: 'PUT',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            Authorization: `Basic ${apiKey}`
        },
        body: JSON.stringify({
            backgroundColor: 'transparent',
            format: 'png',
            returnImage: true,
            assetId: asset
        })
    };

    let response = await fetch(`${config.scenario.apiUrl}/images/erase-background`, options)

    let json = await response.json()

    return json.asset.url
}