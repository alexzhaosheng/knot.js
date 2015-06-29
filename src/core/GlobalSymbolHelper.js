/*
    Manage the global symbols.
    Global symbols are those symbols which cope the global scope. The reason for creating this manager is to avoid the
    name conflict with javascript global scope.
    Now global symbols are primarily embedded functions and templates. For the codes created for cross project reusing,
    use global symbol helper is also recommended.
*/
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    var _symbolCount = 0;
    var _knotSymbols = {};
    __private.GlobalSymbolHelper ={
        //register a global symbol with name
        registerNamedSymbol: function (name, value) {
            if(_knotSymbols[name]) {
                __private.Log.error("The global symbol'" + name + "' has been registered.");
                return;
            }
            _knotSymbols[name] = value;
        },
        //register a global symbol and return  an unique name for it
        registerSymbol: function (value) {
            var name = "s"+_symbolCount++;
            _knotSymbols[name] = value;
            return "__knot_global." + name;
        },

        //get registered global symbol
        getSymbol: function (name) {
            var sections = name.split(".");
            var v = global;
            if(sections[0] === "__knot_global") {
                v = _knotSymbols;
                sections.splice(0, 1);
            }
            for(var i=0; i< sections.length; i++) {
                if(v === null || typeof(v) === "undefined") {
                    return undefined;
                }
                v = v[sections[i]];
            }
            return v;
        },

        //test whether the given name is global symbol. this only works for the name returns by "registerSymbol"
        isGlobalSymbol: function (name) {
            return __private.Utility.startsWith(name, "__knot_global.");
        }
    };
})(window);