/*
    Knot private scope management and definition.

* */
(function (global) {
    "use strict";
    //private scope of knot.js
    var __private = {};

    __private.Setting = {
        enablePropertyHook: true
    };

    //default logger, simply write the msg to console
    function defaultLogger(level, msg, exception) {
        if(!global.console) {
            return;
        }
        global.console.log("[" +  level + "]" + msg);
        if (exception) {
            global.console.log(exception);
        }
    }

    __private.Log = {
        Level: {Info: "Info", Warning: "Warning", Error: "Error"},
        log: defaultLogger,
        info: function (msg, exception) {
            this.log(this.Level.Info, msg, exception);
        },
        warning: function (msg, exception) {
            this.log(this.Level.Warning, msg, exception);
        },
        error: function (msg, exception) {
            this.log(this.Level.Error, msg, exception);
        }
    };

    //default debugger. do nothing
    __private.Debugger = {
        knotChanged: function (leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight) {

        },
        knotTied: function (leftTarget, rightTarget, knotOption) {
        },
        knotUntied: function (leftTarget, rightTarget, knotOption) {

        },

        nodeAdded: function (node) {

        },
        nodeRemoved: function (node) {

        },

        errorStatusChanged: function(node, ap, errorStatus){

        }
    };

    global.Knot = {
        //this function will be deleted then private scope is sealed
        getPrivateScope: function () {
            return __private;
        }
    };
})(window);