/*
    This is the facede of the knot.js.
    It seal the private scope, expose the APIs and do the automatic initialization works
* */

(function (global) {
    "use strict";

    var __private = global.Knot.getPrivateScope();
    //seal private scope
    delete global.Knot.getPrivateScope;

    //These APIs are not
    global.Knot.Advanced = {
        //register a access pointer provider
        registerAPProvider: function (provider) {
            return __private.KnotManager.registerAPProvider(provider);
        },

        //register a logger
        registerLogger: function (logger) {
            __private.Log.log = logger;
        },
        //register a debugger
        registerDebugger: function (dbg) {
            __private.Debugger = dbg;
        },

        //it create the the elements from template and add them to node's children collection
        //and synchronize the elements in node's children and array
        synchronizeItems: function (parentNode, valueArray, template, onCreated, onRemoved) {
            __private.HTMLAPProvider.syncItems(parentNode, valueArray, template, onCreated, onRemoved);
        },

        //create a node from template. Note it only create the HTML node, it may not bind the data to the node
        //call setDataContext to bind data to the node
        createFromTemplate: function (template, data, owner) {
            return __private.HTMLKnotBuilder.createFromTemplate(template, data, owner);
        },

        //set data context for the node and it's offspring
        setDataContext: function (node, data) {
            __private.HTMLKnotBuilder.setDataContext(node, data);
        },

        //get the value on data by the path
        getValueOnPath: function (data, path) {
            return __private.Utility.getValueOnPath(data, path);
        },

        //register a global symbol with name
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

        __private.HTMLKnotBuilder.forceUpdateValues(rootNode);

        var result = [];
        __private.HTMLErrorAPProvider.getErrorStatusInformation(rootNode, result);
        return result;
    };

    //notify knot system that object is changed.
    global.Knot.notifyObjectChanged = function (object, path, oldValue, newValue) {
        __private.DataObserver.notifyDataChanged(object, path, oldValue, newValue);
    };
    //monitor the change of the object
    global.Knot.monitorObject = function (object, path, callback) {
        __private.DataObserver.monitorObject(object, path, callback);
    };
    //stop monitoring the object
    global.Knot.stopMonitoringObject = function (object, path, callback) {
        __private.DataObserver.stopMonitoring(object, path, callback);
    };
    //get properties changed records
    global.Knot.getPropertiesChangeRecords = function (object) {
        return __private.DataObserver.getPropertiesChangeRecords(object);
    };
    //clear properties changed records
    global.Knot.clearPropertiesChangeRecords = function (object) {
        return __private.DataObserver.clearPropertiesChangeRecords(object);
    };


    //clear all of the knots
    global.Knot.clear = function () {
        __private.HTMLKnotBuilder.clear();
    };

    //get the current data context of the element
    //if there's no dataContext on the node, search on it's ancestors
    global.Knot.getDataContext = function (htmlElement) {
        return __private.HTMLKnotBuilder.getDataContextOfHTMLNode(htmlElement);
    };

    //returns the element that bound with the given data.
    global.Knot.findElementBindToData= function (elements, data) {
        for(var i=0; i<elements.length; i++) {
            if (global.Knot.getDataContext(elements[i]) === data) {
                return elements;
            }
        }
    };

    //set the hash format. it'll parse the hash into different status according to the hash format
    //statuses: array of the names of the statuses in hash
    //splitter: the splitter to divide the statuses in hash
    global.Knot.setHashFormat = function(statuses, splitter){
        __private.WindowHashStatus.setHashFormat(statuses, splitter);
    };

    global.Knot.getKnotVariant = function(name){
        return __private.Utility.getValueOnPath(null, name);
    };
    global.Knot.setKnotVariant = function(name, value){
        return __private.Utility.setValueOnPath(null, name, value);
    };

    //////////////////////////////////////////////
    //automatically initialize when loading
    //////////////////////////////////////////////
    var _onReadyCallbacks = [];
    var _initError;
    global.Knot.ready = function (callback) {
        _onReadyCallbacks.push(callback);

        if(global.Knot.isReady || _initError) {
            notifyInitOver();
        }
    };

    function notifyInitOver() {
        var i;

        for(i=0; i< _onReadyCallbacks.length; i++){
            try{
                if(_initError) {
                    _onReadyCallbacks[i](false, _initError);
                }
                else{
                    _onReadyCallbacks[i](true);
                }
            }
            catch (e){
                __private.Log.warning("Execute on ready callback failed.", e);
            }
        }
        _onReadyCallbacks.length = 0;
    }

    global.Knot.isReady = false;

    global.addEventListener("load", function () {
        var deferred =__private.HTMLKnotBuilder.parseCBS();

        deferred.done(function () {
            __private.HTMLKnotBuilder.applyCBS();
            __private.HTMLKnotBuilder.processTemplateNodes();
            __private.HTMLKnotBuilder.bind();
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