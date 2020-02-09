"use strict"

//#region IMPORT
const { ipcRenderer } = require("electron")
const audioSrc = require("./AudioSource")
//#endregion

//#region CONST
//#endregion

//#region GLOBAL
var AUDIO_LIBRARY
//#endregion

AUDIO_LIBRARY = []

/**
 * When the page is fully loaded
 */
$(document).ready(() => {

    //#region VARIABLES   
    //#endregion

    //#region HELPERS

    /**
     * Constructs an audio library UI element & saves AudioSource obj to library
     * @param {AudioSource} audioSource An object containing the needed audio source information
     */
    const addAudioSourceToLibrary = (audioSource, save) => {
        let html

        html = $("#audioLibrary").html()

        $("#audioLibrary").html(html + `<div class="col-md-3 card" style="color: black;text-align: center;">
                <div class="card-body card-inner">
                    <h5 class="card-title" id="audioTitle">${audioSource.title}</h5>
                    <div class="btn-group" role="group" data-audioSource="${audioSource.files.intro},${audioSource.files.body}">
                        <button type="button" class="btn btn-dark dispatchFadeIn">⤴</button>
                        <button type="button" class="btn btn-dark dispatchPlay">▶</button>
                        <button type="button" class="btn btn-dark dispatchPause">⏸</button>
                        <button type="button" class="btn btn-dark dispatchStop">⏹</button>
                        <button type="button" class="btn btn-dark dispatchFadeOut">⤵</button>
                    </div>
                </div>
            </div>`)

        AUDIO_LIBRARY.push(audioSource)

        if (save) ipcRenderer.send("update-audiolib", AUDIO_LIBRARY)

    }

    /**
     * Resets the state of the spinner + login button
     */
    const resetButtons = () => {
        $("#spnrLoading").hide()
        $("#btnClientConnect").attr("disabled", false)
    }

    ipcRenderer.send("load-audiolib")

    //#endregion

    //#region IPC EVENTS

    /**
     * Fires when an existing audio library has been read
     * @param {IpcMainEvent} event The event object
     * @param {Array} audioLib The library data, as read by the main process
     */
    ipcRenderer.on("load-audiolib", (event, audioLib) => {
        audioLib.forEach(audioSource => {
            addAudioSourceToLibrary(audioSource, false)
        })
    })

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
        resetButtons()
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

        resetButtons()

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
        let btnConnect, spnrLoading,
            msgConnection

        btnConnect = $("#btnClientConnect")
        spnrLoading = $("#spnrLoading")
        msgConnection = $("#msgConnection")

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
    })

    /**
     * Populates the channel selector w/ available voice chat channels
     * when guild is selected
     */
    $("#selectGuild").on("change", event => {
        let eventTarget

        eventTarget = event.target

        // grab guild channels 
        ipcRenderer.send("client-get-channels",
            eventTarget.options[eventTarget.selectedIndex].value)
    })

    /**
     * Translates the selected file + title into a DTO to send to main process.
     * Afterwards, it will construct an audio library UI element based on the file given
     */
    $("#saveNewAudio").on("click", event => {
        let fileLoc, invalidHelper,
            fileTitle, hasIntro,
            fileOptions, invalid

        invalid = false
        hasIntro = $("#hasIntroFile").prop("checked")
        fileTitle = $("#fileTitle").val()
        fileLoc = $("#fileInput")[0].files[0]

        invalidHelper = (bool, elementId) => {
            if (bool) {
                $(elementId).show()
                invalid = true
            }
            else {
                $(elementId).hide()
            }
        }

        invalidHelper(fileTitle === "", "#invalid-title")
        invalidHelper(!fileLoc, "#invalid-file")

        if (invalid) return

        fileLoc = fileLoc.path

        if (hasIntro) {
            let introFileLoc

            introFileLoc = fileLoc.replace(/\./g, "Intro.")

            fileOptions = {
                "intro": introFileLoc,
                "body": fileLoc
            }
        }
        else {
            fileOptions = {
                "body": fileLoc
            }
        }

        addAudioSourceToLibrary(new audioSrc.AudioSource(fileTitle, fileOptions), true)

        $("#dismissModal").trigger("click")
    })

    /**
     * Plays the selected audio file
     */
    $("#audioLibrary").on("click", "button.dispatchPlay", () => {
        ipcRenderer.send("dispatch-play",
            event.target.parentElement.getAttribute("data-audioSource"), false)
    })

    /** 
     * Plays selected audio file w/ fade in 
     */
    $("#audioLibrary").on("click", "button.dispatchFadeIn", () => {
        ipcRenderer.send("dispatch-play",
            event.target.parentElement.getAttribute("data-audioSource"), true)
    })

    /**
     * Pauses the selected audio file
     */
    $("#audioLibrary").on("click", "button.dispatchPause", () => {
        ipcRenderer.send("dispatch-pause")
    })

    /**
     * Ends playback of audio file
     */
    $("#audioLibrary").on("click", "button.dispatchStop", () => {
        ipcRenderer.send("dispatch-end")
    })

    /**
     * Ends playback of audio file by fading out
     */
    $("#audioLibrary").on("click", "button.dispatchFadeOut", () => {
        ipcRenderer.send("dispatch-fade-out")
    })

    //#endregion
})