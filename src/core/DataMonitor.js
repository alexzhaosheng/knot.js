(function(window){
    var __private = window.Knot.getPrivateScope();

    ///////////////////////////////////////////////////////
    // Value changed callbacks management
    ///////////////////////////////////////////////////////

    var PATH_FOR_OBJECT_ITSELF = "*";
    __private.DataMonitor = {
        //if property is "*", callback will be executed when any property is changed.
        register: function(data, path, callback, attachedData) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks) {
                attachedInfo.changedCallbacks = {};
            }
            if(!path){
                path=PATH_FOR_OBJECT_ITSELF;
            }

            if(!attachedInfo.changedCallbacks[path]){
                attachedInfo.changedCallbacks[path] = [];
            }

            attachedInfo.changedCallbacks[path].push({callback: callback, attachedData:attachedData});
        },
        unregister: function(data, path, callback) {
            if(!path)
                path = PATH_FOR_OBJECT_ITSELF;

            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks || !attachedInfo.changedCallbacks[path])
                return;

            for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                if (attachedInfo.changedCallbacks[path][i].callback == callback) {
                    attachedInfo.changedCallbacks[path].splice(i, 1);
                    break;
                }
            }
            if (attachedInfo.changedCallbacks[path].length == 0) {
                delete attachedInfo.changedCallbacks[path];
                if(__private.Utility.isEmptyObj(attachedInfo))
                    __private.AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegistered: function(data, path, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                    if (attachedInfo.changedCallbacks[path][i].callback == callback) {
                        return true;
                    }
                }
            }
            return false;
        },
        getAttachedData: function(data, path, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                    if (attachedInfo.changedCallbacks[path][i].callback == callback) {
                        return attachedInfo.changedCallbacks[path][i].attachedData;
                    }
                }
            }
            return null;
        },
        notifyDataChanged: function(data, path, oldValue, newValue) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);

            if(!attachedInfo.changedProperties){
                attachedInfo.changedProperties = [];
            }
            if(attachedInfo.changedProperties.indexOf(path) <0)
                attachedInfo.changedProperties.push(path);

            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                    try{
                        attachedInfo.changedCallbacks[path][i].callback.apply(data, [path, oldValue, newValue]);
                    }
                    catch(error){
                        __private.Log.warning("Call changed callback failed.", error);
                    }
                }
            }
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks["*"]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[PATH_FOR_OBJECT_ITSELF].length; i++) {
                    try{
                        attachedInfo.changedCallbacks[PATH_FOR_OBJECT_ITSELF][i].callback.apply(data, [path, oldValue, newValue]);
                    }
                    catch(error){
                        __private.Log.warning("Call changed callback failed.", error);
                    }
                }
            }
        },
        getPropertiesChangeRecords: function(data){
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo)
                return null;
            return attachedInfo.changedProperties?attachedInfo.changedProperties:[];
        },
        clearPropertiesChangeRecords: function(data){
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo)
                return null;
            attachedInfo.changedProperties = null;
        },

        hookProperty:function(object, property){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                attached.dataHookInfo = {hookedProperties:[], data:{}, hookRefCount:{}};
            }
            if(attached.dataHookInfo.hookedProperties.indexOf(property) >= 0){
                attached.dataHookInfo.hookRefCount[property] ++;
                return;
            }

            //save current value
            attached.dataHookInfo.hookedProperties.push(property);
            attached.dataHookInfo.data[property] = object[property];
            attached.dataHookInfo.hookRefCount[property] = 1;

            //define a new property to overwrite the current one
            try{
                Object.defineProperty(object, property, {
                    set:function(v){
                        var oldValue = attached.dataHookInfo.data[property];
                        if(oldValue == v)
                            return;
                        attached.dataHookInfo.data[property] = v;
                        __private.DataMonitor.notifyDataChanged(this, property, oldValue, v);
                    },
                    get:function(){
                        return attached.dataHookInfo.data[property];
                    },
                    configurable:true, enumerable:true
                })
            }
            catch (err){
                attached.dataHookInfo.hookFailed = true;
                //when trying to hook the global variable from "window" object, it just fail
                __private.Log.warning( "Hook property failed.", err)
            }
        },

        unhookProperty: function(object, property){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                return;
            }
            if(attached.dataHookInfo.hookedProperties.indexOf(property) < 0)
                return;

            if(-- attached.dataHookInfo.hookRefCount[property] > 0){
                return;
            }

            if(!attached.dataHookInfo.hookFailed){
                //remove the hooked property and reset the property to a normal property
                delete  object[property];
                object[property] = attached.dataHookInfo.data[property];
            }

            attached.dataHookInfo.hookedProperties.splice(attached.dataHookInfo.hookedProperties.indexOf(property), 1);
            delete attached.dataHookInfo.data[property];
            delete attached.dataHookInfo.hookRefCount[property];
        },

        hasHookedProperty: function(object, propertyName){
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo){
                return false;
            }
            return attached.dataHookInfo.hookedProperties.indexOf(propertyName) >=0;
        },

        monitorObject:function(object, path, callback, skipCheckingArray){
            var restPath;
            var property = path.substr(0, path.indexOf("."));
            if(!property){
                property = path;
                restPath = null;
            }
            else{
                restPath = path.substr(path.indexOf(".")+1);
            }

            var attachedData = {};
            __private.DataMonitor.register(object, path, callback, attachedData);

            if(restPath){
                attachedData.childChangedCallback = function(p, oldValue, newValue){
                    var path = property +"." + restPath;
                    __private.DataMonitor.notifyDataChanged(object, path, oldValue, newValue);
                }
                attachedData.monitorChildChangedCallback = function(p, oldValue, newValue){
                    if(oldValue){
                        __private.DataMonitor.stopMonitoring(oldValue, restPath, attachedData.childChangedCallback);
                    }
                    if(newValue){
                        __private.DataMonitor.monitorObject(newValue, restPath, attachedData.childChangedCallback, true);
                    }

                    var path = property + "." + restPath;
                    var newChildValue = __private.Utility.getValueOnPath(newValue, restPath);
                    var oldChildValue = __private.Utility.getValueOnPath(oldValue, restPath);
                    __private.DataMonitor.notifyDataChanged(object, path, oldChildValue, newChildValue);
                };
                __private.DataMonitor.register(object, property, attachedData.monitorChildChangedCallback);
                if(object[property]){
                    __private.DataMonitor.monitorObject(object[property], restPath, attachedData.childChangedCallback, true);
                }
            }

            if(!skipCheckingArray){
                //array is treated as a special type of object which can change it self with out changing any property
                //so if the value on the property is an array, it must be monitored too
                //and we need to setup a monitoring callback to monitor the change of the property so that we can hook
                //the array object when it is set with an array object
                attachedData.changedCallback = function(p, oldValue, newValue){
                    if(oldValue instanceof  Array){
                        __private.DataMonitor.unregister(oldValue, "*", attachedData.arrayChangedCallback);
                        delete attachedData.arrayChangedCallback;
                    }
                    if(newValue instanceof Array){
                        attachedData.arrayChangedCallback = function(){
                            __private.DataMonitor.notifyDataChanged(object, path, newValue, newValue);
                        }
                        __private.DataMonitor.register(newValue, "*", attachedData.arrayChangedCallback);
                    }
                }
                __private.DataMonitor.register(object, path, attachedData.changedCallback, attachedData);

                var curValue = __private.Utility.getValueOnPath(object, path);
                if(curValue instanceof Array){
                    attachedData.changedCallback("*", null, curValue);
                }
            }

            __private.DataMonitor.hookProperty(object, property);
        },

        monitor: function(object, path, callback){
            if(path){
                if(path[0] == "/"){
                    path = path.substr(1);
                    object = window;
                }
               this.monitorObject(object, path, callback);
            }
            else{
                __private.DataMonitor.register(object, null, callback);
            }
        },

        stopMonitoring:function(object, path, callback){
            if(!path){
                __private.DataMonitor.unregister(object, path, callback);
            }
            else{
                if(path[0] == "/"){
                    path = path.substr(1);
                    object = window;
                }

                var restPath;
                var property = path.substr(0, path.indexOf("."));
                if(!property){
                    property = path;
                    restPath = null;
                }
                else{
                    restPath = path.substr(path.indexOf(".")+1);
                }

                var attachedData = __private.DataMonitor.getAttachedData(object, path, callback);
                if(attachedData){
                    if(attachedData.monitorChildChangedCallback){
                        __private.DataMonitor.unregister(object, property, attachedData.monitorChildChangedCallback);
                    }

                    if(attachedData.childChangedCallback && object[property]){
                        __private.DataMonitor.stopMonitoring(object[property], restPath, attachedData.childChangedCallback);
                    }

                    if(attachedData.changedCallback){
                        __private.DataMonitor.unregister(object, path, attachedData.changedCallback);
                    }
                    if(attachedData.arrayChangedCallback){
                        __private.DataMonitor.unregister(__private.Utility.getValueOnPath(object, path), "*", attachedData.arrayChangedCallback);
                    }
                }
                __private.DataMonitor.unregister(object, path, callback);
                __private.DataMonitor.unhookProperty(object, property);
            }
        }
    }

})((function() {
        return this;
    })());