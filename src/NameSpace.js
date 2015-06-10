(function(){
    var __private = {};

    __private.Setting={
        enablePropertyHook: true
    };

    __private.Log={
        Level:{Info:"Info", Warning:"Warning", Error:"Error"},
        Source:{Knot:"Knot", Client:"Client"},
        log:function(source, level, msg, exception){
            console.log("["+source+"." + level + "]" + msg);
            if(exception){
                console.log(exception);
            }
        },
        info:function(source, msg, exception){
            this.log(source, this.Level.Info, msg, exception);
        },
        warning:function(source, msg, exception){
            this.log(source, this.Level.Warning, msg, exception);
        },
        error:function(source, msg, exception){
            this.log(source, this.Level.Error, msg, exception);
        }
    };

    //window.Knot will be overwritted in Knot.js so that "getPrivateScope" would not be exposed
    //to outside once Knot.js is loaded.
    window.Knot = {
        getPrivateScope: function(){
            return __private;
        }
    }
})();