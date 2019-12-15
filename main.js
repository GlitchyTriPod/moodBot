"use strict"

//#region IMPORT
const { app, BrowserWindow, ipcMain } = require("electron")
const discord = require("discord.js")
// import { Client } from "discord.js"
//#endregion

//#region CONST
const CLIENT = new discord.Client()
//#endregion

//#region GLOBALS
var MAIN_WINDOW
//#endregion

//#region AppEvents
app.on("ready", () => {

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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
})

app.on("activate", () => {
    if (MAIN_WINDOW === null) createWindow()
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

            if (err.message.match(/incorrect login details/gi)){
                msg = "Invalid token!"
            }
            else {    
                msg = "Could not log in!"            
            }
            
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
        }).catch(err => console.log(err))
    
    event.returnValue = true
})

//#endregion