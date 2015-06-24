(function (global) {
    "use strict";

    var __private = global.Knot.getPrivateScope();
    //seal private scope
    delete global.Knot.getPrivateScope;

    //register a access pointer provider
    global.Knot.Advanced = {
        registerAPProvider: function (provider) {
            return __private.AccessPointManager.registerAPProvider(provider);
        },

        registerLog: function (logger) {
            __private.Log.log = logger;
        },
        registerDebugger: function (dbg) {
            __private.Debugger = dbg;
        },
        synchronizeItems: function (parentNode, valueArray, template, onCreated, onRemoved) {
            __private.HTMLAPProvider.syncItems(parentNode, valueArray, template, onCreated, onRemoved);
        },
        createFromTemplate: function (template, data, owner) {
            return __private.HTMLKnotManager.createFromTemplate(template, data, owner);
        },
        setDataContext: function (node, data) {
            __private.HTMLKnotManager.setDataContext(node, data);
        },
        getValueOnPath: function (data, path) {
            return __private.Utility.getValueOnPath(data, path);
        },

        registerNamedGlobalSymbol: function (name, value) {
            return __private.GlobalSymbolHelper.registerNamedSymbol(name, value);
        }
    };

    //get the error status for the rootNode and all of the children nodes within it
    //the error status information is returned in this form:
    //[{node:(DOM node where error happens), accessPointName:{the name for the access point where error happens}, error:(The exception object)}, ...]
    //return an empty array if there's no error.
    global.Knot.getErrorStatusInformation = function (rootNode) {
        if(!rootNode) {
            rootNode = document.body;
        }

        __private.HTMLKnotManager.forceUpdateValues(rootNode);

        var result = [];
        __private.HTMLErrorAPProvider.getErrorStatusInformation(rootNode, result);
        return result;
    };

    global.Knot.notifyObjectChanged = function (object, path, oldValue, newValue) {
        __private.DataObserver.notifyDataChanged(object, path, oldValue, newValue);
    };
    global.Knot.monitorObject = function (object, path, callback) {
        __private.DataObserver.monitorObject(object, path, callback);
    };
    global.Knot.stopMonitoringObject = function (object, path, callback) {
        __private.DataObserver.stopMonitoring(object, path, callback);
    };
    global.Knot.getPropertiesChangeRecords = function (object) {
        return __private.DataObserver.getPropertiesChangeRecords(object);
    };
    global.Knot.clearPropertiesChangeRecords = function (object) {
        return __private.DataObserver.clearPropertiesChangeRecords(object);
    };


    global.Knot.clear = function () {
        __private.HTMLKnotManager.clear();
    };

    global.Knot.getDataContext = function (htmlElement) {
        return __private.HTMLKnotManager.getDataContextOfHTMLNode(htmlElement);
    };

    global.Knot.findElementBindToData= function (elements, data) {
        for(var i=0; i<elements.length; i++) {
            if (global.Knot.getDataContext(elements[i]) === data) {
                return elements;
            }
        }
    };

    //automatically initialize when loading
    var _onReadyCallback;
    var _initError;
    global.Knot.ready = function (callback) {
        _onReadyCallback = callback;

        if(global.Knot.isReady || _initError) {
            notifyInitOver();
        }
    };

    function notifyInitOver() {
        if(!_onReadyCallback) {
            return;
        }
        if(_initError) {
            _onReadyCallback(false, _initError);
        }
        else if(global.Knot.isReady) {
            _onReadyCallback(true);
        }
    }

    global.Knot.isReady = false;

    global.addEventListener("load", function () {
        var deferred =__private.HTMLKnotManager.parseCBS();

        deferred.done(function () {
            __private.HTMLKnotManager.applyCBS();
            __private.HTMLKnotManager.processTemplateNodes();
            __private.HTMLKnotManager.bind();
            global.Knot.isReady = true;
            _initError = null;
            notifyInitOver();
        },
        function (error) {
            global.Knot.isReady = false;
            _initError = error;
            notifyInitOver();
        });
    });
})(window);