let photo = null;

export function resamplePhoto(file) {

    let image = document.createElement("img")
    image.src = file
    image.onload = function () {

        let canvas = document.getElementById("image_input")
        // canvas.width = 512
        // canvas.height = 512
        // const context = canvas.getContext("2d")
        // context.drawImage(image, 0, 0, 512, 512)
        // instead of resizing, crop the image from center with 512 size
        let width = image.width
        let height = image.height
        let size = Math.min(width, height)
        let x = (width - size) / 2
        let y = (height - size) / 2
        canvas.width = 512
        canvas.height = 512
        const context = canvas.getContext("2d")
        context.drawImage(image, x, y, size, size, 0, 0, 512, 512)
        
        // TODO properly crop and change color settings

        canvas.toBlob(function (blob) {
            photo = blob
            image.remove()
            // canvas.remove()
        }, "image/png")
        
    }
}

// Return a photo if available, otherwise return null. Photo is nulled on return
export function getPhoto() {
    let returnPhoto = photo
    photo = null
    return returnPhoto
}