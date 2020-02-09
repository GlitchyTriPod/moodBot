"use strict"

// Allow class to be exported
Object.defineProperty(exports, "__esModule", {
    value: true
})

/**
 * Manages voice channel connection and exposes dispatcher
 * so that it can be controlled from renderer process.
 */
class ConnectionAudio {

    constructor(connection) {
        this.connection = connection
        this.dispatcher = null
        this.audioLoc = null
    }

    /**
     * Plays the selected file.
     * @param {string} fileLocation 
     */
    play(fileLocation, fadeIn) {
        let files, introFileLocation, 
            strConcat

        files = fileLocation.split(",")

        if (files[0] === "undefined"){
            fileLocation = files[1]
        }
        else {
            introFileLocation = files[0]
            fileLocation = files[1]
        }

        // Check if requested file is already being played
        if (fileLocation === this.audioLoc) {
            // If dispatcher exists and is paused, unpause
            if (this.dispatcher && this.dispatcher.paused) {
                this.pause()
                return
            }
            // Throw away process if file to play is already being played
            return
        }

        // Set audio location to copy of fileLocation
        this.audioLoc = fileLocation.slice()

        // create file location concat string
        strConcat = (fileLocation + "|").repeat(100) // repeat 100 times -- should be at least 2 hours of loop time
        strConcat = strConcat.slice(0, strConcat.length - 1)

        if (introFileLocation){
            strConcat = `${introFileLocation}|${strConcat}`
        }

        strConcat = "concat:" + strConcat

        // Play concat-ed file
        this.dispatcher = this.connection.playArbitraryInput(strConcat)

        // If fadeIn was specified, fade in music
        if (fadeIn) {
            this.dispatcher.setVolume(0)

            let interval, context
            context = this
            interval = setInterval(() => {
                if (context.dispatcher.volume >= 1) {
                    context.dispatcher.setVolume(1)
                    clearInterval(interval)
                }
                else {
                    context.dispatcher.setVolume(
                        context.dispatcher.volume + 0.05
                    )
                }
            }, 200)
        }
    }

    /**
     * Toggles playback of file.
     */
    pause() {
        this.dispatcher.paused ? this.dispatcher.resume() : this.dispatcher.pause()
    }

    /**
     * Ends playback of the file (Resets FileLoc)
     */
    end() {
        this.dispatcher.end()
        this.audioLoc = null
    }

    /**
     * Ends playback by fading out
     */
    fadeOut() {
        let interval, context

        context = this
        interval = setInterval(() => {
            if (context.dispatcher.volume <= 0) {
                context.end()
                context.dispatcher.setVolume(1)
                clearInterval(interval)
            }
            context.dispatcher.setVolume(
                context.dispatcher.volume - 0.05
            )
        }, 200)
    }
}

// Enable class export
exports.ConnectionAudio = ConnectionAudio