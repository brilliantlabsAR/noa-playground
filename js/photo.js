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
        
        // reduce levels
        let imageData = context.getImageData(0, 0, 512, 512)
        for (let i = 0; i < imageData.data.length; i += 4) {
            let r = imageData.data[i]
            let g = imageData.data[i + 1]
            let b = imageData.data[i + 2]
            let a = imageData.data[i + 3]
            imageData.data[i] = Math.floor(r / 32) * 32
            imageData.data[i + 1] = Math.floor(g / 32) * 32
            imageData.data[i + 2] = Math.floor(b / 32) * 32
        }

        // add  noise
        let noise = 0.1
        for (let i = 0; i < imageData.data.length; i += 4) {
            let r = imageData.data[i]
            let g = imageData.data[i + 1]
            let b = imageData.data[i + 2]
            let a = imageData.data[i + 3]
            let rand = Math.random() * noise - noise / 2
            imageData.data[i] = Math.min(255, Math.max(0, r + r * rand))
            imageData.data[i + 1] = Math.min(255, Math.max(0, g + g * rand))
            imageData.data[i + 2] = Math.min(255, Math.max(0, b + b * rand))
        }
        context.putImageData(imageData, 0, 0)
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
    // photo = null
    return returnPhoto
}