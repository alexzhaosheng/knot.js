/*
    DataObserver provides the ability of monitoring the change of object
    Note it is not only able to detecting the change or the property, but also
     be able to observe a "path" so that you can get the notification when it's children is changed
 */
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    //indicate object it self
    var PATH_FOR_OBJECT_ITSELF = "*";

    __private.DataObserver = {
        //hook data change event for the "path" on "data".
        on: function (data, path, callback, attachedData) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks) {
                attachedInfo.changedCallbacks = {};
            }

            //if property is "*", callback will be executed when any property is changed.
            //if there's no path, use "*" as default
            if(!path) {
                path=PATH_FOR_OBJECT_ITSELF;
            }

            if(!attachedInfo.changedCallbacks[path]) {
                attachedInfo.changedCallbacks[path] = [];
            }

            attachedInfo.changedCallbacks[path].push({callback: callback, attachedData:attachedData});
        },
        //stop hooking the data change event
        off: function (data, path, callback) {
            if(!path) {
                path = PATH_FOR_OBJECT_ITSELF;
            }

            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks || !attachedInfo.changedCallbacks[path]) {
                return;
            }

            for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                if (attachedInfo.changedCallbacks[path][i].callback === callback) {
                    attachedInfo.changedCallbacks[path].splice(i, 1);
                    break;
                }
            }
            if (attachedInfo.changedCallbacks[path].length === 0) {
                delete attachedInfo.changedCallbacks[path];
                if(__private.Utility.isEmptyObj(attachedInfo)) {
                    __private.AttachedData.releaseAttachedInfo(data);
                }
            }
        },

        //test whether an event is registered
        hasRegistered: function (data, path, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                    if (attachedInfo.changedCallbacks[path][i].callback === callback) {
                        return true;
                    }
                }
            }
            return false;
        },

        //get attached data for a hooked change event
        getAttachedData: function (data, path, callback) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                for (var i = 0; i < attachedInfo.changedCallbacks[path].length; i++) {
                    if (attachedInfo.changedCallbacks[path][i].callback === callback) {
                        return attachedInfo.changedCallbacks[path][i].attachedData;
                    }
                }
            }
            return null;
        },

        //notify the data is changed, and call the callbacks registered with this data and path
        notifyDataChanged: function (data, path, oldValue, newValue) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);

            if(!attachedInfo.changedProperties) {
                attachedInfo.changedProperties = [];
            }
            if(attachedInfo.changedProperties.indexOf(path) <0) {
                attachedInfo.changedProperties.push(path);
            }

            var callbacks, i;
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[path]) {
                //clone the array. it may change the array during the callback is executed;
                callbacks = attachedInfo.changedCallbacks[path].slice(0);
                for (i = 0; i < callbacks.length; i++) {
                    try{
                        callbacks[i].callback.apply(data, [path, oldValue, newValue]);
                    }
                    catch(error) {
                        __private.Log.warning("Call changed callback failed.", error);
                    }
                }
            }
            if (attachedInfo.changedCallbacks && attachedInfo.changedCallbacks[PATH_FOR_OBJECT_ITSELF]) {
                callbacks = attachedInfo.changedCallbacks[PATH_FOR_OBJECT_ITSELF].slice(0);
                for (i = 0; i < callbacks.length; i++) {
                    try{
                        callbacks[i].callback.apply(data, [path, oldValue, newValue]);
                    }
                    catch(error) {
                        __private.Log.warning("Call changed callback failed.", error);
                    }
                }
            }
        },

        //return the changed properties for the data since "clearPropertiesChangeRecords" is called on the data last time
        getPropertiesChangeRecords: function (data) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo) {
                return null;
            }
            return attachedInfo.changedProperties?attachedInfo.changedProperties:[];
        },

        //clear the changed properties record.
        clearPropertiesChangeRecords: function (data) {
            var attachedInfo = __private.AttachedData.getAttachedInfo(data);
            if(!attachedInfo) {
                return null;
            }
            attachedInfo.changedProperties = null;
        },

        //monitor the change for a property on object
        //if it's "*", monitor all of the change of the properties
        hookProperty: function (object, property) {
            if(property === "*") {
                return;
            }
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo) {
                attached.dataHookInfo = {hookedProperties:[], data:{}, hookRefCount:{}};
            }
            if(attached.dataHookInfo.hookedProperties.indexOf(property) >= 0) {
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
                    set: function (v) {
                        var oldValue = attached.dataHookInfo.data[property];
                        if(oldValue === v) {
                            return;
                        }
                        attached.dataHookInfo.data[property] = v;
                        __private.DataObserver.notifyDataChanged(this, property, oldValue, v);
                    },
                    get: function () {
                        return attached.dataHookInfo.data[property];
                    },
                    configurable:true, enumerable:true
                });
            }
            catch (err) {
                attached.dataHookInfo.hookFailed = true;
                //when trying to hook the global variable from "window" object, it just fail
                __private.Log.warning( "Hook property failed.", err);
            }
        },

        //unhook a property change
        unhookProperty: function (object, property) {
            if(property === "*") {
                return;
            }
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo) {
                return;
            }
            if(attached.dataHookInfo.hookedProperties.indexOf(property) < 0) {
                return;
            }

            if(-- attached.dataHookInfo.hookRefCount[property] > 0) {
                return;
            }

            if(!attached.dataHookInfo.hookFailed) {
                //remove the hooked property and reset the property to a normal property
                delete  object[property];
                object[property] = attached.dataHookInfo.data[property];
            }

            attached.dataHookInfo.hookedProperties.splice(attached.dataHookInfo.hookedProperties.indexOf(property), 1);
            delete attached.dataHookInfo.data[property];
            delete attached.dataHookInfo.hookRefCount[property];
        },

        //test whether a property is hooked
        hasHookedProperty: function (object, propertyName) {
            var attached = __private.AttachedData.getAttachedInfo(object);
            if(!attached.dataHookInfo) {
                return false;
            }
            return attached.dataHookInfo.hookedProperties.indexOf(propertyName) >=0;
        },


        //this is the recursive call to setup the monitoring hook for the properties in path
        //Array is processed specially, "*" must be listened to capture the change in array. But it only
        //needs to be listened once, therefore listen array process will be skipped when it's called recursively
        monitorObject: function (object, path, callback, skipCheckingArray) {
            var restPath;
            var property = path.substr(0, path.indexOf("."));
            if(!property) {
                property = path;
                restPath = null;
            }
            else{
                restPath = path.substr(path.indexOf(".")+1);
            }

            var attachedData = {};
            __private.DataObserver.on(object, path, callback, attachedData);

            if(restPath) {
                attachedData.childChangedCallback = function (p, oldValue, newValue) {
                    var path = property +"." + restPath;
                    __private.DataObserver.notifyDataChanged(object, path, oldValue, newValue);
                };
                attachedData.monitorChildChangedCallback = function (p, oldValue, newValue) {
                    if(oldValue) {
                        __private.DataObserver.stopMonitoring(oldValue, restPath, attachedData.childChangedCallback);
                    }
                    if(newValue) {
                        __private.DataObserver.monitorObject(newValue, restPath, attachedData.childChangedCallback, true);
                    }

                    var path = property + "." + restPath;
                    var newChildValue = __private.Utility.getValueOnPath(newValue, restPath);
                    var oldChildValue = __private.Utility.getValueOnPath(oldValue, restPath);
                    __private.DataObserver.notifyDataChanged(object, path, oldChildValue, newChildValue);
                };
                __private.DataObserver.on(object, property, attachedData.monitorChildChangedCallback);
                if(object[property]) {
                    __private.DataObserver.monitorObject(object[property], restPath, attachedData.childChangedCallback, true);
                }
            }

            if(!skipCheckingArray) {
                //array is treated as a special type of object which can change it self with out changing any property
                //so if the value on the property is an array, it must be monitored too
                //and we need to setup a monitoring callback to monitor the change of the property so that we can hook
                //the array object when it is set with an array object
                attachedData.changedCallback = function (p, oldValue, newValue) {
                    if(oldValue instanceof  Array) {
                        __private.DataObserver.off(oldValue, "*", attachedData.arrayChangedCallback);
                        delete attachedData.arrayChangedCallback;
                    }
                    if(newValue instanceof Array) {
                        attachedData.arrayChangedCallback = function () {
                            __private.DataObserver.notifyDataChanged(object, path, newValue, newValue);
                        };
                        __private.DataObserver.on(newValue, "*", attachedData.arrayChangedCallback);
                    }
                };
                __private.DataObserver.on(object, path, attachedData.changedCallback, attachedData);

                var curValue = __private.Utility.getValueOnPath(object, path);
                if(curValue instanceof Array) {
                    attachedData.changedCallback("*", null, curValue);
                }
            }

            __private.DataObserver.hookProperty(object, property);
        },

        //monitor a path change on a object.
        //it automatically hook the change of the object(s) relevant to the path and
        //build the change event for the whole path
        //the path can be absolute path starts with "/"
        monitor: function (object, path, callback) {
            if(path) {
                if(path[0] === "/") {   //if it's absolute path
                    path = path.substr(1);
                    object = global;
                }
               this.monitorObject(object, path, callback);
            }
            else{
                __private.DataObserver.on(object, null, callback);
            }
        },

        //stop monitoring the change for the path on the object
        stopMonitoring: function (object, path, callback) {
            if(!path) {
                __private.DataObserver.off(object, path, callback);
            }
            else{
                if(path[0] === "/") {
                    path = path.substr(1);
                    object = global;
                }

                var restPath;
                var property = path.substr(0, path.indexOf("."));
                if(!property) {
                    property = path;
                    restPath = null;
                }
                else{
                    restPath = path.substr(path.indexOf(".")+1);
                }

                var attachedData = __private.DataObserver.getAttachedData(object, path, callback);
                if(attachedData) {
                    if(attachedData.monitorChildChangedCallback) {
                        __private.DataObserver.off(object, property, attachedData.monitorChildChangedCallback);
                    }

                    if(attachedData.childChangedCallback && object[property]) {
                        __private.DataObserver.stopMonitoring(object[property], restPath, attachedData.childChangedCallback);
                    }

                    if(attachedData.changedCallback) {
                        __private.DataObserver.off(object, path, attachedData.changedCallback);
                    }
                    if(attachedData.arrayChangedCallback) {
                        __private.DataObserver.off(__private.Utility.getValueOnPath(object, path), "*", attachedData.arrayChangedCallback);
                    }
                }
                __private.DataObserver.off(object, path, callback);
                __private.DataObserver.unhookProperty(object, property);
            }
        }
    };

})(window);