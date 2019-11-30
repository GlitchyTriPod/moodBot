"use strict"

//#region IMPORT
const { ipcRenderer } = require("electron")
//#endregion

//#region CONST

//#endregion

//#region GLOBAL
//#endregion

/**
 * When the page is fully loaded
 */
$(document).ready(() => {

    //#region VARIABLES
    let ResetButtons
    //#endregion

    //#region HELPERS

    /**
     * Resets the state of the spinner + login button
     */
    ResetButtons = () => {
        $("#spnrLoading").hide()
        $("#btnClientConnect").attr("disabled", false)
    }

    //#endregion

    //#region IPC EVENTS

    /**
     * Fires when the client is ready
     * Appends available guilds to the selectGuild dropdown menu
     * @param {IpcMainEvent} event The event object
     * @param {Array} availableGuilds Collection of guilds available to the client
     */
    ipcRenderer.on("client-ready", (event, availableGuilds) => {

        let guildOptions

        guildOptions = "<option default>Select a server...</option>"
            + "<option> =========== </option>"

        availableGuilds.forEach(guild => {
            guildOptions += `<option value="${guild.id}">${guild.name}</option>`
        })
        
        // List the guild names into the server selector
        $("#selectGuild").html(guildOptions)
    })

    /**
     * Displays successful login message
     * @param {IpcMainEvent} event The event object
     */
    ipcRenderer.on("login-successful", event => {
        ResetButtons()
        $("#msgConnection").css("color", "#1eff00").text("✔ Connected!").fadeIn("fast")
    })

    /**
     * Displays error message to the user if unable to log in
     * @param {IpcMainEvent} event The event object
     * @param {String} errMsg Error message
     */
    ipcRenderer.on("login-fail", (event, errMsg) => {
        let msgConnection

        msgConnection = $("#msgConnection")

        ResetButtons()
        
        msgConnection.css("color", "red").text(`❌ ${errMsg}`).fadeIn("fast")        

        setTimeout(() => {
            msgConnection.fadeOut("slow")
        }, 3000);
    })

    /**
     * Updates the selectChannel dropdown 
     * @param {IpcMainEvent} event The event object
     * @param {Array} availableChannels Array of available channels
     */
    ipcRenderer.on("channels-returned", (event, availableChannels) => {

        let channelOptions
        
        channelOptions = "<option default>Select a channel...</option>"
            + "<option> =========== </option>"

        $("#selectChannel").html(() => {

            availableChannels.forEach(channel => {
                channelOptions += `<option value="${channel.id}">${channel.name}</option>`
            })

            return channelOptions
        })
    })

    //#endregion

    //#region DOM EVENTS

    /**
     * Handles connection button click
     */
    $("#btnClientConnect").on("click", () => {

        //#region VARIABLES
        let btnConnect, spnrLoading, msgConnection
        //#endregion

        btnConnect = $("#btnClientConnect")
        spnrLoading = $("#spnrLoading")
        msgConnection = $("#msgConnection")

        //#region HELPERS
        
        //#endregion

        //log off current client
        ipcRenderer.sendSync("client-destroy")
        
        btnConnect.attr("disabled", true) // disable login button to prevent user from clicking multiple times
        spnrLoading.show() // show spinner
        msgConnection.hide() // hide "✔ Connected!" message if it exists

        ipcRenderer.send("client-login", $("#txtBotToken").val())
    })

    /**
     * Connects to the selected voice channel
     */
    $("#btnChannelConnect").on("click", () => {

        let selectedGuildId, selectedChannelId   

        selectedGuildId = $("#selectGuild").val()
        selectedChannelId = $("#selectChannel").val()

        ipcRenderer.send("client-join-channel", selectedGuildId, selectedChannelId)

        // let selectedChannelID = (() => {
        //     let channelSelector = document.getElementById("selectChannel")
        //     return channelSelector.options[channelSelector.selectedIndex].value
        // })()

        // let selectedChannel = CHANNELS.find(channel => channel.id === selectedChannelID)

    })

    /**
     * Populates the channel selector w/ available voice chat channels
     * when guild is selected
     */
    $("#selectGuild").on("change", event => {

        let eventTarget

        eventTarget = event.target        

        //grab guild channels 
        ipcRenderer.send("client-get-channels", eventTarget.options[eventTarget.selectedIndex].value)        
    })

    //#endregion
})
