(function(){
    var __private = {};

    __private.Setting={
        enablePropertyHook: true
    }

    //window.Knot will be overwritted in Knot.js so that "getPrivateScope" would not be exposed
    //to outside once Knot.js is loaded.
    window.Knot = {
        getPrivateScope: function(){
            return __private;
        }
    }
})();