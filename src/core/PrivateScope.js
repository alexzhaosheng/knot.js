
(function (window) {
    var __private = {};

    __private.Setting = {
        enablePropertyHook: true
    };

    function defaultLogger(level, msg, exception) {
        window.console.log("[" +  level + "]" + msg);
        if (exception) {
            window.console.log(exception);
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

        }
    };

    //window.Knot will be overwritted in Knot.js so that "getPrivateScope" would not be exposed
    //to outside once Knot.js is loaded.
    window.Knot = {
        getPrivateScope: function (){
            return __private;
        }
    }
})((function () {
        return this;
    })());