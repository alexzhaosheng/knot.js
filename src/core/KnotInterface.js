(function(){
    var __private = Knot.getPrivateScope();
    //seal private scope
    delete window.Knot.getPrivateScope;

    //register a access pointer provider
    window.Knot.registerAPProvider = function(provider){
        return __private.AccessPointManager.registerAPProvider(provider);
    };

    //get the error status for the rootNode and all of the children nodes within it
    //the error status information is returned in this form:
    //[{node:(DOM node where error happens), accessPointName:{the name for the access point where error happens}, error:(The exception object)}, ...]
    //return an empty array if there's no error.
    window.Knot.getErrorStatusInformation = function(rootNode){
        if(!rootNode)
            rootNode = document.body;
        var result = [];
        __private.HTMLAPProvider.getErrorStatusInformation(rootNode, result);
        return result;
    };

    window.Knot.notifyObjectChanged = function(object, path, oldValue, newValue){
        __private.DataMonitor.notifyDataChanged(object, path, oldValue, newValue);
    }
    window.Knot.monitorObject = function(object, path, callback){
        __private.DataMonitor.monitorObject(object, path, callback);
    }
    window.Knot.stopMonitoringObject = function(object, path, callback){
        __private.DataMonitor.stopMonitoring(object, path, callback);
    }
    window.Knot.getPropertiesChangeRecords = function(object){
        return __private.DataMonitor.getPropertiesChangeRecords(object);
    }
    window.Knot.clearPropertiesChangeRecords = function(object){
        return __private.DataMonitor.clearPropertiesChangeRecords(object);
    }

    window.Knot.createFromTemplate = function(id){
        return __private.HTMLKnotManager.createFromTemplate(id);
    }

    window.Knot.clear = function(){
        __private.HTMLKnotManager.clear();
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
        if(!_initError)
            _onReadyCallback(false, _initError);
        else if(window.Knot.isReady)
            _onReadyCallback(true);
    }

    window.Knot.isReady = false;

    document.body.addEventListener("load", function(){
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
})();