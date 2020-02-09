"use strict"

// Allow class to be exported
Object.defineProperty(exports, "__esModule", {
    value: true
})

class AudioSource {
    
    constructor(fileTitle, fileOptions){
        this.files = {
            "intro": fileOptions.intro,
            "body": fileOptions.body
        }
        this.title = fileTitle
    }
}

// Enable class export
exports.AudioSource = AudioSource