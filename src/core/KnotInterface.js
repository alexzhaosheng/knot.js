(function(window){
    var __private = window.Knot.getPrivateScope();
    //seal private scope
    delete window.Knot.getPrivateScope;

    //register a access pointer provider
    window.Knot.Advanced = {
        registerAPProvider:function(provider){
            return __private.AccessPointManager.registerAPProvider(provider);
        },

        registerLog: function(logger){
            __private.Log.log = logger;
        },
        registerDebugger: function(dbg){
            __private.Debugger = dbg;
        },
        synchronizeItems: function(parentNode, valueArray, template, onCreated, onRemoved){
            __private.HTMLAPProvider.syncItems(parentNode, valueArray, template, onCreated, onRemoved);
        },
        createFromTemplate:function(template, data, owner){
            return __private.HTMLKnotManager.createFromTemplateAndUpdateData(template, data, owner);
        },
        getValueOnPath: function(data, path){
            return __private.Utility.getValueOnPath(data, path);
        },

        registerNamedGlobalSymbol:function(name, value){
            return __private.GlobalSymbolHelper.registerNamedSymbol(name, value);
        }
    }

    //get the error status for the rootNode and all of the children nodes within it
    //the error status information is returned in this form:
    //[{node:(DOM node where error happens), accessPointName:{the name for the access point where error happens}, error:(The exception object)}, ...]
    //return an empty array if there's no error.
    window.Knot.getErrorStatusInformation = function(rootNode){
        if(!rootNode)
            rootNode = document.body;

        __private.HTMLKnotManager.forceUpdateValues(rootNode);

        var result = [];
        __private.HTMLErrorAPProvider.getErrorStatusInformation(rootNode, result);
        return result;
    };

    window.Knot.notifyObjectChanged = function(object, path, oldValue, newValue){
        __private.DataObserver.notifyDataChanged(object, path, oldValue, newValue);
    }
    window.Knot.monitorObject = function(object, path, callback){
        __private.DataObserver.monitorObject(object, path, callback);
    }
    window.Knot.stopMonitoringObject = function(object, path, callback){
        __private.DataObserver.stopMonitoring(object, path, callback);
    }
    window.Knot.getPropertiesChangeRecords = function(object){
        return __private.DataObserver.getPropertiesChangeRecords(object);
    }
    window.Knot.clearPropertiesChangeRecords = function(object){
        return __private.DataObserver.clearPropertiesChangeRecords(object);
    }


    window.Knot.clear = function(){
        __private.HTMLKnotManager.clear();
    }

    window.Knot.getDataContext = function(htmlElement){
        return __private.HTMLKnotManager.getDataContextOfHTMLNode(htmlElement);
    }
    window.Knot.findElementBindToData= function(elements, data){
        for(var i=0; i<elements.length; i++)
            if(window.Knot.getDataContext(elements[i]) == data)
                return elements;
    }

    //automatically initialize when loading
    var _onReadyCallback;
    var _initError;
    window.Knot.ready = function(callback){
        _onReadyCallback = callback;

        if(window.Knot.isReady || _initError != null)
            notifyInitOver();
    };

    function notifyInitOver(){
        if(!_onReadyCallback)
            return;
        if(_initError)
            _onReadyCallback(false, _initError);
        else if(window.Knot.isReady)
            _onReadyCallback(true);
    }

    window.Knot.isReady = false;

    window.addEventListener("load", function(){
        var deferred =__private.HTMLKnotManager.parseCBS();

        deferred.done(function(){
            __private.HTMLKnotManager.applyCBS();
            __private.HTMLKnotManager.processTemplateNodes();
            __private.HTMLKnotManager.bind();
            window.Knot.isReady = true;
            _initError = null;
            notifyInitOver();
        },
        function(error){
            window.Knot.isReady = false
            _initError = error;
            notifyInitOver();
        });
    });
})((function() {
        return this;
    })());