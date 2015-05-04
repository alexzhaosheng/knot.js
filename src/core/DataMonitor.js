(function(){

    var __private = Knot.getPrivateScope();

    ///////////////////////////////////////////////////////
    // Value changed callbacks management
    ///////////////////////////////////////////////////////
    __private.DataMonitor = {
        //if property is "*", callback will be executed when any property is changed.
        register: function(data, property, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks) {
                attachedInfo.changedCallbacks = [];
            }
            if(!attachedInfo.changedCallbacks[property]){
                attachedInfo.changedCallbacks[property] = [];
            }

            attachedInfo.changedCallbacks[property].push({callback: callback});
        },
        unregister: function(data, property, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks || !attachedInfo.changedCallbacks[property])
                return;

            for (var i = 0; i < attachedInfo.changedCallbacks[property].length; i++) {
                if (attachedInfo.changedCallbacks[property][i].callback == callback) {
                    attachedInfo.changedCallbacks[property].splice(i, 1);
                    break;
                }
            }
            if (attachedInfo.changedCallbacks[property].length == 0) {
                delete attachedInfo.changedCallbacks[property];
                if(__private.Utility.isEmptyObj(attachedInfo))
                    __private.AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegistered: function(data, property, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[property]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[property].length; i++) {
                    if (attachedInfo.changedCallbacks[property][i].callback == callback) {
                        return true;
                    }
                }
            }
            return false;
        },
        notifyDataChanged: function(data, propertyName, oldValue, newValue) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);

            if(!attachedInfo.changedProperties){
                attachedInfo.changedProperties = [];
            }
            if(attachedInfo.changedProperties.indexOf(propertyName) <0)
                attachedInfo.changedProperties.push(propertyName);

            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[propertyName]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[propertyName].length; i++) {
                    try{
                        attachedInfo.changedCallbacks[propertyName][i].callback.apply(data, [propertyName, oldValue, newValue]);
                    }
                    catch(error){
                        __private.Log.log(__private.Log.Source.Client, __private.Log.Level.Warning, error);
                    }
                }
            }
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks["*"]) {
                for (var i = 0; i < attachedInfo.changedCallbacks["*"].length; i++) {
                    try{
                        attachedInfo.changedCallbacks["*"][i].callback.apply(data, [propertyName, oldValue, newValue]);
                    }
                    catch(error){
                        __private.Log.log(__private.Log.Source.Client, __private.Log.Level.Warning, error);
                    }
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
        },

        hookProperty:function(object, property){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                attached.dataHookInfo = {hookedProperties:[], data:{}};
            }
            if(attached.dataHookInfo.hookedProperties.indexOf(property) >= 0)
                return;

            //save current value
            attached.dataHookInfo.hookedProperties.push(property);
            attached.dataHookInfo.data[property] = object[property];

            //define a new property to overwrite the current one
            Object.defineProperty(object, property, {
                set:function(v){
                    var oldValue = attached.dataHookInfo.data[property];
                    attached.dataHookInfo.data[property] = v;
                    __private.DataMonitor.notifyDataChanged(this, property, oldValue, v);
                },
                get:function(){
                    return attached.dataHookInfo.data[property];
                },
                configurable:true, enumerable:true
            })
        },

        unhookProperties: function(object){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                return;
            }

            for(var i=0; i<attached.dataHookInfo.hookedProperties.length; i++){
                var property =attached.dataHookInfo.hookedProperties[i];
                delete  object[property];
                object[property] = attached.dataHookInfo.data[property];
            }
            delete attached.dataHookInfo;
        },

        hasHookedProperty: function(object, propertyName){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                return false;
            }
            return attached.dataHookInfo.hookedProperties.indexOf(propertyName) >=0;
        },

        monitor: function(object, property, callback){
            this.register(object, property, callback)
            if(!this.hasHookedProperty(object, property)){
                this.hookProperty(object, property);
            }
        },

        stopMonitoringObject:function(object, property, callback){
            this.unregister(object, property, callback);
        }
    }
})();