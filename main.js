"use strict"

//#region IMPORT
const { app, BrowserWindow, ipcMain } = require("electron")
const fs = require("fs")
const discord = require("discord.js")
const connAudio = require("./modules/ConnectionAudio")
//#endregion

//#region CONST
const CLIENT = new discord.Client()
//#endregion

//#region GLOBALS
var MAIN_WINDOW, CONN_AUDIO,
    AUDIO_LIBRARY
//#endregion

//#region AppEvents

/**
 * When app is ready, set up window
 */
app.on("ready", () => {
    fs.access("audiolib.json", err => {
        if (err) {
            console.log("audiolib.json file does not exist.")
            AUDIO_LIBRARY = []
            return
        }
        else {
            fs.readFile("audiolib.json", (err, data) => {
                AUDIO_LIBRARY = JSON.parse(data)
            })
        }
    })

    MAIN_WINDOW = new BrowserWindow({
        width: 1280,
        height: 720,
        webPreferences: {
            nodeIntegration: true
        }
    })

    MAIN_WINDOW.loadFile("./dist/moodbot.html")

    MAIN_WINDOW.on("closed", () => {
        MAIN_WINDOW = null
    })
})

/**
 * Destroy client and quit application when window is closed.
 */
app.on("window-all-closed", () => {
    fs.writeFile("audiolib.json", JSON.stringify(AUDIO_LIBRARY),
        "utf8", () => {
            CLIENT.destroy()
            app.quit()
        })
})

//#endregion

//#region Discord Client

/**
 * Prints client error message to the console
 * @param {Exception} err The thrown error
 */
CLIENT.on("error", err => console.error(err))

/**
 * When the client is ready, send available guilds to the main window
 */
CLIENT.on("ready", () => {
    let availableGuilds

    availableGuilds = []

    CLIENT.guilds.filter(guild => guild.available).forEach(guild => {
        availableGuilds.push({
            id: guild.id,
            name: guild.name
        })
    })

    MAIN_WINDOW.webContents.send("client-ready", availableGuilds)
})

//#endregion

//#region IPC functions

/**
 * -ASYNC-
 * Sends the Audio Library to the renderer process
 * @param {ipcMainEvent} event The event object
 */
ipcMain.on("load-audiolib", event => {
    MAIN_WINDOW.webContents.send("load-audiolib", AUDIO_LIBRARY)
})

/**
 * -ASYNC-
 * Sets the Audio library const to the current version present on the renderer process
 * @param {IpcMainEvent} event The event object
 * @param {Array} audioLib An array object containing the current version of the audio library
 */
ipcMain.on("update-audiolib", (event, audioLib) => AUDIO_LIBRARY = audioLib)

//#region Discord Client

/**
 * -SYNC-
 * Destroys the current client
 * @param {IpcMainEvent} event The event object
 */
ipcMain.on("client-destroy", event => {
    CLIENT.destroy()
    event.returnValue = true
})

/**
 * -ASYNC-
 * Logs in the Client using the given token
 * @param {IpcMainEvent} event The event object
 * @param {String} token The login token given by the user
 */
ipcMain.on("client-login", (event, token) => {
    CLIENT.login(token)
        .then(() => event.sender.send("login-successful"))
        .catch(err => {
            let msg

            if (err.message.match(/incorrect login details/gi)) msg = "Invalid token!"
            else msg = "Could not log in!"

            event.sender.send("login-fail", msg)
        })
})

/**
 * -SYNC-
 * Returns a list of voice channels from the selected Guild
 * @param {IpcMainEvent} event The event object
 * @param {String} selectedGuildId The ID of the selected Guild
 */
ipcMain.on("client-get-channels", (event, selectedGuildId) => {
    let availableChannels

    availableChannels = []

    CLIENT.guilds.get(selectedGuildId)
        .channels.filter(channel => channel.type === "voice")
        .forEach(channel => {
            availableChannels.push({
                id: channel.id,
                name: channel.name
            })
        })

    event.sender.send("channels-returned", availableChannels)
})

/**
 * -ASYNC-
 * Joins the selected voice channel
 * @param {IpcMainEvent} event The event object
 * @param {String} selectedGuildId The ID of the Guild to join
 * @param {String} selectedChannelId The ID of the Channel to join
 */
ipcMain.on("client-join-channel", (event, selectedGuildId, selectedChannelId) => {
    let selectedChannel

    selectedChannel = CLIENT.guilds.get(selectedGuildId)
        .channels.get(selectedChannelId)

    selectedChannel.join()
        .then(connection => {
            CONN_AUDIO = new connAudio.ConnectionAudio(connection)
        }).catch(err => console.log(err))

    // event.returnValue = true
})

//#endregion

//#region ConnectionAudio dispatch

/**
 * -ASYNC-
 * Plays the selected audio file.
 * @param {IpcMainEvent} event The event object
 * @param {string} fileLocation The file location
 */
ipcMain.on("dispatch-play", (event, fileLocation, fadeIn) => {
    CONN_AUDIO.play(fileLocation, fadeIn)
})

/**
 * -ASYNC-
 * Pauses the currently playing audio
 * @param {IpcMainEvent} event The event object
 */
ipcMain.on("dispatch-pause", event => {
    CONN_AUDIO.pause()
})

/**
 * -ASYNC-
 * End playback of the current audio file
 * @param {IpcMainEvent} event The event object
 */
ipcMain.on("dispatch-end", event => {
    CONN_AUDIO.end()
})

/**
 * -ASYNC-
 * Ends playback of the current audio file by fading out
 * @param {IpcMainEvent} event The event object
 */
ipcMain.on("dispatch-fade-out", event => {
    CONN_AUDIO.fadeOut()
})
//#endregion

//#endregion