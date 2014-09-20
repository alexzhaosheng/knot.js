(function(){
    var __private = {};
    window.Knot = {
        getPrivateScope: function(){
            return __private;
        }
    }

    /////////////////////////////////////
    //mock debugger. will be replaced if debugger is activated
    ////////////////////////////////////
    __private.knotDebugger = {
        debug:function(knotInfo, valueName, status){}
    }
})();