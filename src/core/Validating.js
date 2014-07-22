(function(){

    var __private = Knot.getPrivateScope();

///////////////////////////////////////////////////////
    // Validating management
    ///////////////////////////////////////////////////////
    __private.Validating = {
        onValidatingCallbacks: [],

        setError: function(data, property, errorMessage) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            //if nobody is lisening, simple ignore
            if (!attachedInfo.validating)
                return;


            if (!attachedInfo.validating.currentErrorMessages[property] && !errorMessage)
                return;

            attachedInfo.validating.currentErrorMessages[property] = errorMessage;
            for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
                attachedInfo.validating.callbacks[i].callback.apply(data, [property]);
            }
        },
        getError: function(data, property){
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.validating)
                return null;
            return attachedInfo.validating.currentErrorMessages[property];
        },
        registerOnError: function(data, listener, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);

            if (!attachedInfo.validating) {
                attachedInfo.validating = {callbacks:[], currentErrorMessages:[]};
            }

            attachedInfo.validating.callbacks.push({ listener: listener, callback: callback });
        },
        unregisterOnError: function(data, listener) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.validating)
                return;
            for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
                if (attachedInfo.validating.callbacks[i].listener == listener) {
                    attachedInfo.validating.callbacks.splice(i, 1);
                    break;
                }
            }
            if (attachedInfo.validating.callbacks.length == 0) {
                delete attachedInfo.validating;
                if (__private.Utility.isEmptyObj(attachedInfo))
                    __private.AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegisteredOnError: function(data, listener) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.validating) {
                return false;
            }
            if (attachedInfo.validating.callbacks) {
                for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
                    if (attachedInfo.validating.callbacks[i].listener == listener) {
                        return true;
                    }
                }
            }
            return false;
        }
    };
})();