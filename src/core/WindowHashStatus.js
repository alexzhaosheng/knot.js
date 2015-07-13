/*
     This provides the ability of binding to window.location.hash
     It store the status of hash into a knot global variant named "$hash". First it stores the original hash into $hash.originalHash,
     then if there's hash format specified by user, it the status according to the hash format
* */
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
                __private.Utility.setValueOnPath(null, "$hash.originalHash", value);
            }
        }
        finally{
            _isInUpdateHash = false;
        }
    }


    function updateHashStatus(){
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
            }
            __private.Utility.setValueOnPath(null, "$hash.originalHash", hash);
        }
        finally{
            _isInUpdateHash = false;
        }
    }

    __private.Utility.setValueOnPath(null, "$hash", {});
    var _hashObj = __private.Utility.getValueOnPath(null, "$hash");

    updateHashStatus();

    __private.WindowHashStatus = {
        //set the hash format. it'll parse the hash into different status according to the hash format
        //fields: array of the names of the statuses in hash
        //splitter: the splitter to divide the statuses in hash
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
            //remove the monitoring to the old statuses
            if(_hashFields){
                for(i=0; i< _hashFields.length; i++){
                    __private.DataObserver.stopMonitoring(_hashObj, _hashFields[i], updateHash);
                }
            }
            _hashFields = fields;
            _fieldSplitter = splitter;

            //monitoring to the statuses
            if(_hashFields){
                for(i=0; i< _hashFields.length; i++){
                    __private.DataObserver.monitor(_hashObj, _hashFields[i], updateHash);
                }
            }
            updateHashStatus();
        }
    };

    __private.DataObserver.monitor(_hashObj, "originalHash", function(){
        window.location.hash = "#" + _hashObj.originalHash;
        updateHashStatus();
    });

    window.addEventListener("hashchange", function(){
        updateHashStatus();
    });

})(window);