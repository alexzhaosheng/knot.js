(function(){

    var __private = Knot.getPrivateScope();

    ///////////////////////////////////////////////////////
    // Value changed callbacks management
    ///////////////////////////////////////////////////////
    __private.DataEventMgr = {
        register: function(data, listener, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks) {
                attachedInfo.changedCallbacks = [];
            }

            attachedInfo.changedCallbacks.push({ listener: listener, callback: callback });
        },
        unregister: function(data, listener) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks)
                return;
            for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                if (attachedInfo.changedCallbacks[i].listener == listener) {
                    attachedInfo.changedCallbacks.splice(i, 1);
                    break;
                }
            }
            if (attachedInfo.changedCallbacks.length == 0) {
                delete attachedInfo.changedCallbacks;
                if(__private.Utility.isEmptyObj(attachedInfo))
                    __private.AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegistered: function(data, listener) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks) {
                for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                    if (attachedInfo.changedCallbacks[i].listener == listener) {
                        return true;
                    }
                }
            }
            return false;
        },
        notifyDataChanged: function(data, propertyName) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);

            if(!attachedInfo.changedProperties){
                attachedInfo.changedProperties = [];
            }
            if(attachedInfo.changedProperties.indexOf(propertyName) <0)
                attachedInfo.changedProperties.push(propertyName);

            if (attachedInfo.changedCallbacks) {
                for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                    attachedInfo.changedCallbacks[i].callback.apply(data, [propertyName]);
                }
            }
        },
        getPropertyChangeRecord: function(data){
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo)
                return null;
            return attachedInfo.changedProperties?attachedInfo.changedProperties:[];
        },
        resetPropertyChangeRecord: function(data){
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo)
                return null;
            attachedInfo.changedProperties = null;
        }
    }
})();