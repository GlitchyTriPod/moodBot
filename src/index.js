"use strict"

//#region IMPORT
import { Client } from "discord.js"
//#endregion

//#region CONST
const CLIENT = new Client()
//#endregion

//#region GLOBAL
var AVAILABLE_GUILDS, CHANNELS
//#endregion

/**
 * When the page is fully loaded
 */
$(document).ready(() => {

    //#region VARIABLES

    //#endregion

    //#region HELPERS

    //#endregion

    //#region EVENTS

    /**
     * Event fires when client has successfully logged in
     */
    CLIENT.on("ready", () => {


        let guildOptions = "<option default>Select a server...</option>"
            + "<option> =========== </option>"

        AVAILABLE_GUILDS = CLIENT.guilds.filter(guild => guild.available)

        // List the guild names into the server selector
        $("#selectGuild").html(() => {

            AVAILABLE_GUILDS.forEach(guild => {
                guildOptions += `<option value="${guild.id}">${guild.name}</option>`
            })

            return guildOptions
        })

    })

    /**
     * Print client error message to the console when error is hit
     */
    CLIENT.on("error", err => console.error(err))

    /**
     * Handles connection button click
     */
    $("#btnClientConnect").on("click", () => {

        //#region VARIABLES
        let btnConnect, spnrLoading, msgConnection, ResetButtons
        //#endregion

        //#region HELPERS
        ResetButtons = () => {
            spnrLoading.hide()
            btnConnect.attr("disabled", false)
        }
        //#endregion

        CLIENT.destroy()
        AVAILABLE_GUILDS = null
        CHANNELS = null

        btnConnect = $("#btnConnect")
        spnrLoading = $("#spnrLoading")
        msgConnection = $("#msgConnection")

        btnConnect.attr("disabled", true)
        spnrLoading.show()
        msgConnection.hide()

        CLIENT.login(
            $("#txtBotToken").val()
        ).then(() => {
            ResetButtons()
            msgConnection.css("color", "#1eff00").text("✔ Connected!").fadeIn("fast")
        }).catch(err => {
            ResetButtons()
            if (err.message.match(/incorrect login details/gi)) {
                msgConnection.css("color", "red").text("❌ Invalid token!").fadeIn("fast")
                setTimeout(() => {
                    msgConnection.fadeOut("slow")
                }, 3000)
            }
        })
    })

    /**
     * Connects to the selected voice channel
     */
    $("#btnChannelConnect").on("click", () => {

        let channel

        CHANNELS.find(channel => channel.id === $("#selectChannel").val())
            .join().then(connection => console.log("successfully joined voice channel!"))
            .catch(console.error("Could not join channel"))

    })

    /**
     * Populates the channel selector w/ available voice chat channels
     * when guild is selected
     */
    $("#selectGuild").on("change", event => {

        let channelOptions = "<option default>Select a channel...</option>"
            + "<option> =========== </option>"

        //grab guild channels
        CHANNELS = AVAILABLE_GUILDS.find(guild => guild.id === $(event.target).val())
            //filter out non-voice channels
            .channels.filter(channel => channel.type === "voice")

        //list channels in selector
        $("#selectChannel").html(() => {
            CHANNELS.forEach(channel => {
                channelOptions += `<option value="${channel.id}">${channel.name}</option>`
            })

            return channelOptions
        })
    })
})
