(function(){
    var __private = {};

    __private.Setting={
        enablePropertyHook: true
    };

    __private.Log={
        Level:{Info:"Info", Warning:"Warning", Error:"Error"},
        Source:{Knot:"Knot", Client:"Client"},
        log:function(source, level, msg, exception){
            Console.writeln("["+source+"." + level + "]" + msg);
            if(exception){
                Console.writeln(exception);
            }
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