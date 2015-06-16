/*

*/
(function(window){
    var __private = window.Knot.getPrivateScope();

    var _symbolCount = 0;
    var _knotSymbols = {};
    __private.GlobalSymbolHelper =
    {
        registerSymbol: function(symbol){
            var name = "s"+_symbolCount++;
            _knotSymbols[name] = symbol;
            return "__knot_global." + name;
        },
        getSymbol:function(name){
            var sections = name.split(".");
            var v = window;
            if(sections[0] == "__knot_global"){
                v = _knotSymbols;
                sections.splice(0, 1);
            }
            for(var i=0; i< sections.length; i++){
                if(v == null || typeof(v) == "undefined"){
                    return undefined;
                }
                v = v[sections[i]];
            }
            return v;
        },
        isGlobalSymbol:function(name){
            return __private.Utility.startsWith(name, "__knot_global.");
        }
    }
})((function() {
        return this;
    })());