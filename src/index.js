"use strict"

//#region CONST
const Discord = require("discord.js/browser")
const client = new Discord.Client()
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
    client.on("ready", () => {
        
    })

    /**
     * Print client error message to the console when error is hit
     */
    client.on("error", (err) => {
        console.error(err)
    })

    /**
     * Handles connection button click
     */
    $("#btnConnect").on("click", () => {

        //#region VARIABLES
        let btnConnect
        let spnrLoading
        let msgConnection
        let hlpr
        //#endregion

        //#region HELPERS
        hlpr = () => {
            spnrLoading.hide()
            btnConnect.attr("disabled", false)
        }
        //#endregion

        btnConnect = $("#btnConnect")
        spnrLoading = $("#spnrLoading")
        msgConnection = $("#msgConnection")

        btnConnect.attr("disabled", true)
        spnrLoading.show()
        msgConnection.hide()

        client.login(
            $("#txtBotToken").val()
        ).then(() => {
            hlpr()
            msgConnection.css("color", "#1eff00").text("✔ Connected!").fadeIn("fast")
        }).catch((err) => {
            hlpr()
            if (err.message.match(/incorrect login details/gi)) {
                msgConnection.css("color", "red").text("❌ Invalid token!").fadeIn("fast")
                setTimeout(() => {
                    msgConnection.fadeOut("slow")
                }, 3000)
            }
        })
    })
})