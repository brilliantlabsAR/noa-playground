let photo = null;

export function resamplePhoto(file) {

    let image = document.createElement("img")
    image.src = file
    image.onload = function () {

        let canvas = document.createElement("canvas")
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext("2d")
        context.drawImage(image, 0, 0, 512, 512)
        // TODO properly crop and change color settings

        canvas.toBlob(function (blob) {
            photo = blob
        }, "image/png")
    }
}

// Return a photo if available, otherwise return null. Photo is nulled on return
export function getPhoto() {
    let returnPhoto = photo
    photo = null
    return returnPhoto
}