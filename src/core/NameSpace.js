(function(window){
    var __private = {};

    __private.Setting={
        enablePropertyHook: true
    };

    __private.Log={
        Level:{Info:"Info", Warning:"Warning", Error:"Error"},
        log:function(level, msg, exception){
            console.log("["+ level + "]" + msg);
            if(exception){
                console.log(exception);
            }
        },
        info:function(msg, exception){
            this.log( this.Level.Info, msg, exception);
        },
        warning:function(msg, exception){
            this.log( this.Level.Warning, msg, exception);
        },
        error:function(msg, exception){
            this.log(this.Level.Error, msg, exception);
        }
    };

    //window.Knot will be overwritted in Knot.js so that "getPrivateScope" would not be exposed
    //to outside once Knot.js is loaded.
    window.Knot = {
        getPrivateScope: function(){
            return __private;
        }
    }
})((function() {
        return this;
    })());