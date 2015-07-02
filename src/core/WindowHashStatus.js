(function (window) {
    "use strict";
    var __private = window.Knot.getPrivateScope();

    var _hashFields;
    var _fieldSplitter;

    function getHash(){
        if(window.location.hash) {
            return window.location.hash.substr(1);
        }
        else {
            return "";
        }
    }

    var _isInUpdateHash = false;
    function updateHash(){
        if(_isInUpdateHash){
            return;
        }
        _isInUpdateHash = true;
        try{
            if(_hashFields){
                var r= "";
                var values = _hashFields.map(function(t){return __private.Utility.getValueOnPath(null, "$hash." + t);});
                //remove the empty value at the end
                for(var i=values.length-1; i>=0; i--){
                    if(values[i]){
                        break;
                    }
                    values.length = i;
                }
                var value = "";
                if(values.length > 0){
                    value = values.join(_fieldSplitter);
                }
                window.location.hash = "#" + value;
                __private.Utility.setValueOnPath(null, "$hash.hash", value);
            }
        }
        finally{
            _isInUpdateHash = false;
        }
    }


    function updateHashVariant(){
        if(_isInUpdateHash){
            return;
        }
        _isInUpdateHash = true;
        try{
            var hash = getHash();
            if(_hashFields){
                var fields = __private.Utility.splitWithBlockCheck(hash, _fieldSplitter);
                for(var i=0; i<_hashFields.length; i++){
                    __private.Utility.setValueOnPath(null, "$hash."+_hashFields[i], fields[i]);
                }
                __private.Utility.setValueOnPath(null, "$hash.hash", hash);
            }
            else{
                __private.Utility.setValueOnPath(null, "$hash.hash", hash);
            }
        }
        finally{
            _isInUpdateHash = false;
        }
    }

    __private.Utility.setValueOnPath(null, "$hash", {});
    var _hashObj = __private.Utility.getValueOnPath(null, "$hash");

    updateHashVariant();

    __private.WindowHashStatus = {
        setHashFormat: function(fields, splitter){
            if(!(fields instanceof  Array)){
                throw new Error("Hash fields must be an array.");
            }
            if(fields.indexOf("hash")>=0){
                throw new Error("Hash field can't be 'hash'.");
            }
            if(!splitter){
                throw new Error("Please specify the splitter.");
            }
            var i;
            if(_hashFields){
                for(i=0; i< _hashFields.length; i++){
                    __private.DataObserver.stopMonitoring(_hashObj, _hashFields[i], updateHash);
                }
            }
            _hashFields = fields;
            _fieldSplitter = splitter;

            if(_hashFields){
                for(i=0; i< _hashFields.length; i++){
                    __private.DataObserver.monitor(_hashObj, _hashFields[i], updateHash);
                }
            }
            updateHashVariant();
        }
    };

    __private.DataObserver.monitor(_hashObj, "hash", function(){
        updateHash();
        updateHashVariant();
    });

    window.addEventListener("hashchange", function(){
        updateHashVariant();
    });

})(window);