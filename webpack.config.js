const path = require("path")

module.exports = {
    entry: /*"./main.js"*/ "./js/index.js",
    target: "electron-renderer",
    devtool: "eval-source-map"
    // node:{
    //     fs: "empty"
    // }
}