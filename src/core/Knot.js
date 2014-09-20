/*!
 * knot.js core
 * www.knotjs.com
 * Copyright 2013 Sheng(Alex) Zhao 
 * Released under the MIT license 
 * 
 */

(function () {
    var __private = Knot.getPrivateScope();

    ///////////////////////////////////////////////////////////
    // item template management and item sync
    ///////////////////////////////////////////////////////////
    function cloneTemplateNode(node){
        var setAttachedData = function(n, c){
            if(n.__knot_parsedOptions){
                c.__knot_parsedOptions =  JSON.parse(JSON.stringify( n.__knot_parsedOptions));
                c.__knot_parsedOptions.isTemplate = false;
            }
            else{
                c.__knot_cbs_options = n.__knot_cbs_options;
            }
            for(var i=0; i< n.children.length; i++)
                setAttachedData(n.children[i], c.children[i]);
        }

        var cloned = node.cloneNode(true);
        setAttachedData(node, cloned);
        return cloned;
    }

    function createItemFromTemplate(knotInfo, data){
        var node = knotInfo.node;
        if(typeof(knotInfo.itemTemplate) == "function"){
            return knotInfo.itemTemplate(data, node)
        }
        else{
            return cloneTemplateNode(knotInfo.itemTemplate);
        }

    }

    var _itemTemplates = {};
    function initTemplate(id){
        if(_itemTemplates[id])
            return _itemTemplates[id];

        var template = document.getElementById(id);
        if(template)
            template.parentNode.removeChild(template);
        else{
            template = __private.Utility.getObjectInGlobalScope(id);
            if(template && typeof(template) != "function"){
                throw new Error("The item template must be a dom element or a callback function");
            }

            if(!template)
                throw new Error("Failed to find item template with name:" + id);
        }
        _itemTemplates[id] = template;
        return template;
    }
    function setupItemTemplate(info){
        if(info.itemTemplate)
            return;
        var template;
        if(!info.options.valueConverters || !info.options.valueConverters["foreach"]){
            template = info.node.children[0];
            if(!template){
                throw new Error("No item template defined. foreach binding requires item template");
            }
            info.node.removeChild(template);
        }
        else{
            var s = info.options.valueConverters["foreach"];
            if(_itemTemplates[s])
                template = _itemTemplates[s];
            else
                template = initTemplate(s);
        }

        info.itemTemplate = template;
    }

    //synchronise the items between array and dom node children, create new, remove old and change order.
    function syncItems(knotInfo, items) {
        setupItemTemplate(knotInfo);

        __private.knotDebugger.debug(knotInfo, "foreach", "sync, itemCount:" + (items? items.length:0));

        var findChild = function (node, item) {
            for (var i = 0; i < node.children.length; i++) {
                if (node.children[i].__knotInfo && node.children[i].__knotInfo.dataContext == item) {
                    return node.children[i];
                }
            }
            return null;
        }
        var addChildTo = function (node, child, index) {
            if (node.children.length == index)
                node.appendChild(child);
            else
                node.insertBefore(child, node.children[index]);
        }

        var node = knotInfo.node;
        var contextPath = knotInfo.contextPath + "." + knotInfo.options.binding["foreach"];

        //take null items as empty array.
        if(!items){
            items = [];
        }
        for (var i = 0; i < items.length; i++) {
            var ele = findChild(node, items[i]);
            if (ele) {
                if (Array.prototype.indexOf.call(node.children, ele) != i) {
                    node.removeChild(ele);
                    addChildTo(node, ele, i);
                }
            }
            else {
                var n = createItemFromTemplate(knotInfo, items[i]);
                knotInfo.childrenInfo.push(internalTie(n, items[i], contextPath+".["+i+"]"));
                addChildTo(node, n, i);
                if (knotInfo.options.actions && knotInfo.options.actions.itemCreated) {
                    var callback = __private.Utility.getObjectInGlobalScope(knotInfo.options.actions.itemCreated);
                    if (!callback)
                        throw new Error("Failed to find event handler with name:" + knotInfo.options.actions.itemCreated);
                    callback(items[i], n);
                }
            }
        }

        for (var i = node.children.length - 1; i >= items.length; i--) {
            var n = node.children[i];
            knotInfo.childrenInfo.splice(knotInfo.childrenInfo.indexOf(n.__knotInfo), 1);
            untie(n);
            node.removeChild(n);
        }
    }

    function syncContent(knotInfo){
        var d = __private.Utility.getValueOnPath(knotInfo.dataContext, knotInfo.options.binding.content);
        if(!knotInfo.itemTemplate){
            if(!knotInfo.options.valueConverters.content)
                throw new Error("No item template specified for 'content' binding.");
            knotInfo.itemTemplate = initTemplate(knotInfo.options.valueConverters.content);
        }

        if(knotInfo.node.firstElementChild){
            var childNode = knotInfo.node.firstElementChild;
            if(childNode.__knotInfo){
                if(childNode.__knotInfo.dataContext == d){
                    return;
                }
                else{
                    untie(childNode);
                    knotInfo.childrenInfo.splice(knotInfo.childrenInfo.indexOf(childNode.__knotInfo), 1);
                    knotInfo.node.removeChild(childNode);
                }
            }
            else{
                throw new Error("The element specified with 'content' binding must not has any children.")
            }
        }

        if(d != null){
            var child =createItemFromTemplate(knotInfo, d);
            knotInfo.node.appendChild(child);
            knotInfo.childrenInfo.push(internalTie(child, d, knotInfo.contextPath + "." + knotInfo.options.binding.content));
        }
    }

    ///////////////////////////////////////////////////////////
    // core
    ///////////////////////////////////////////////////////////

    function applyKnots(knotInfo) {
        if (knotInfo.options.twoWayBinding){
            __private.DataMonitor.setupDataNotification(knotInfo, function(knotInfo, p){
                updateDisplay(knotInfo, p);
            });
            setupNodeNotification(knotInfo);
        }

        if(knotInfo.options.actions){
            prepareActions(knotInfo);
        }

        for (var valueName in knotInfo.options.binding) {
            updateDisplay(knotInfo, valueName);
        }
    }
    function updateDisplay(knotInfo, valueName) {
        //for the array, need to bind the array itself as well
        if (valueName == "foreach"){
            var d = __private.Utility.getValueOnPath(knotInfo.dataContext, knotInfo.options.binding[valueName])
            syncItems(knotInfo, d)
        }
        else if(valueName == "content"){
            syncContent(knotInfo)
        }
        else{
            var knotType = __private.Extension.findProperKnotType(knotInfo.node, valueName);
            if (!knotType) {
                throw new Error("Failed to find the proper knot type! tag:"+knotInfo.node.tagName + " type:" + valueName);
            }

            knotType.setValue(knotInfo.node, valueName, getDataValue(knotInfo, valueName));
        }
    }

    function prepareActions(knotInfo){
        for(var action in knotInfo.options.actions){
            if(action == "itemCreated")
                continue;
            (function(){
                var actionType = __private.Extension.findProperActionType(knotInfo.node, action);
                if(!actionType){
                    throw new Error("Failed to find the proper action type!  tag:" +knotInfo.node.tagName + " type:" + action);
                }
                var actionHandle =  __private.Utility.getObjectInGlobalScope(knotInfo.options.actions[action]);
                if(actionHandle == null){
                    throw new Error("Failed to find action hanlder:" + knotInfo.options.actions[action]);
                }
                var handler =function(){
                    var arr = [];
                    for(var i=0 ;i < arguments.length; i++)
                        arr.push(arguments[i]);
                    arr.splice(0, 0, knotInfo.node);

                    actionHandle.apply(knotInfo.dataContext, arr);
                }
                var newHandler = actionType.prepareAction(knotInfo.node, action, handler);

                if(!knotInfo.actionCallbacks)
                    knotInfo.actionCallbacks = [];
                knotInfo.actionCallbacks.push(newHandler?handler:newHandler);
            })();
        }
    }


    ////////////////////////////////////////
    //two way binding setup
    /////////////////////////////////////////

    function setupNodeNotification(knotInfo){
        for (var valueName in knotInfo.options.twoWayBinding) {
            if(valueName != "foreach" && valueName != "content"){
                var knotType = __private.Extension.findProperKnotType(knotInfo.node, valueName);
                if (knotType.isEditingSupported(knotInfo.node, valueName)) {
                    setupNodeMonitoring(knotInfo, knotType, valueName);
                }
            }
        }
    }

    function setupNodeMonitoring(knotInfo, knotType, valueName) {
        if (!knotInfo.nodeMonitoringInfo) {
            knotInfo.nodeMonitoringInfo = {};
        }
        if (!knotInfo.nodeMonitoringInfo[valueName]) {
            knotInfo.nodeMonitoringInfo[valueName] = function () {
                var newValue = knotType.getValue(knotInfo.node, valueName);

                if (knotInfo.options.validators && knotInfo.options.validators[valueName]) {
                    if (validateValue(knotInfo, valueName, newValue,[]))
                        return;
                }
                setDataValue(knotInfo, valueName, newValue);
            };
            knotType.monitorChange(knotInfo.node, valueName, knotInfo.nodeMonitoringInfo[valueName]);
        }
    }

    /////////////////////// two way binding end ///////////////////////////////////////////

    function validateValue(knotInfo, valueName, value, defferedObjects) {
        var data = knotInfo.dataContext;
        var path = knotInfo.options.binding[valueName];
        while (path.indexOf(".") >= 0 && data) {
            data = data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if (!data)
            return;

        var processErrorMessage = function(errMessage){
            __private.Validating.setError(data, path, errMessage);
            for (var i = 0; i < __private.Validating.onValidatingCallbacks.length; i++) {
                __private.Validating.onValidatingCallbacks[i](errMessage, knotInfo.node);
            }
            if (errMessage) {
                return errMessage;
            }
        }

        for (var i = 0; i < knotInfo.options.validators[valueName].length; i++) {
            var validator = __private.Utility.getObjectInGlobalScope(knotInfo.options.validators[valueName][i]);
            if (!validator) {
                throw new Error("Failed to find validator by path:" + knotInfo.options.validators[valueName][i]);
            }
            try {
                var validateRes = validator.apply(knotInfo.dataContext, [value, data,
                    {
                    deferred: function(){return new __private.Deffered();}
                    }]);
                if(validateRes instanceof __private.Deffered){
                    validateRes.done(
                        function(msg){
                            processErrorMessage(msg);
                        },
                        function(msg){
                            processErrorMessage(msg)
                        });
                    defferedObjects.push(validateRes);
                }
                else{
                    if(processErrorMessage(validateRes)){
                        return validateRes;
                    }
                }
            }
            catch (err) {
                processErrorMessage(err.message);
                return err.message;
            }
        }
        return validateRes;
    }


    function getDataValue(knotInfo, valueName) {
        var path =knotInfo.options.binding[valueName];

        if(path[0] == "$"){
            var func = __private.Utility.getObjectInGlobalScope(path.substr(1));
            if(!func){
                throw new Error("Can't find custom knot function! function name: " + path.substr(1));
            }
            return func.apply(knotInfo.dataContext, knotInfo.node);
        }

        var root = knotInfo.dataContext;
        if (path[0] == "/") {
            root = window;
            path = path.substr(1);
        }

        var value;
        if (path == "--self"){
            value = knotInfo.dataContext;
        }
        else if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
            var arr = path.split(".");
            var propertyName = arr[arr.length - 1];
            var objectPath = path.substr(0, path.length - propertyName.length-1);
            var dataToBinding = __private.Utility.getValueOnPath(root, objectPath);
            value = __private.Validating.getError(dataToBinding, propertyName);
        }
        else{
            value = __private.Utility.getValueOnPath(root, path);
        }

        if (valueName != "foreach" && valueName != "content" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = __private.Utility.getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.to) {
                value = converter.to.apply(knotInfo.dataContext, [value]);
            }
        }

        __private.knotDebugger.debug(knotInfo, valueName, "get: " + (value instanceof Array? "{array:("+value.length+")}":value));

        return value;
    }

    function setDataValue(knotInfo, valueName, value) {
        if (!knotInfo.dataContext)
            return;
        var root = knotInfo.dataContext;
        var path = knotInfo.options.binding[valueName]

        if (path[0] == "/") {
            root = window;
            path = path.substr(1);
        }
        if (path == "--self")
            return knotInfo.dataContext;

        if (valueName != "foreach" && valueName != "content" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = __private.Utility.getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.from) {
                value = converter.from.apply(knotInfo.dataContext, [value]);
            }
        }

        var data = root;
        while (path.indexOf(".") >= 0 && data) {
            data= data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if(data){
            data[path] = value;
            __private.knotDebugger.debug(knotInfo, valueName, "set:" + value);
        }
        if(data)
            __private.DataEventMgr.notifyDataChanged(data, path);
    }


    var _isInitialized = false;

    function tie(onFinished, onError){
        if(!_isInitialized){
            if(!onError)
                onError = function(msg)
                {
                    throw new Error(msg);
                };
            __private.CBS.cbsInit(function(){
                _isInitialized = true;
                try{
                    internalTie();
                }
                catch(err){
                    onError(err.message);
                }
                if(onFinished) onFinished();
            },
            onError);
        }
        else{
            internalTie();
        }
    }

    function internalTie(docNode, dataContext, contextPath) {
        if(!docNode)
            docNode = document.body;
        if (docNode.__knotInfo) {
            untie(docNode);
        }
        if(!contextPath)
            contextPath = "/";
        var info = { node: docNode, childrenInfo: [], contextPath: contextPath };
        docNode.__knotInfo = info;

        info.options = __private.OptionParser.parse(docNode);
        if(info.options.dataContextPath){
            var root = dataContext;
            var path = info.options.dataContextPath;
            if(path[0] == "/"){
                root = window;
                contextPath = info.contextPath = path;
                path = path.substr(1);
            }
            else{
                info.contextPath += "." + path;
                contextPath = info.contextPath;
            }
            if(!root)
                root = window;
            dataContext = __private.Utility.getValueOnPath(root, path);
        }
        info.dataContext = dataContext;

        if(info.options.isTemplate){
            if(!info.node.id){
                throw new Error("Template must have an id!")
            }
            initTemplate(info.node.id);
            return null;
        }

        if(info.options.binding && info.options.binding.foreach){
            setupItemTemplate(info);
        }
        //since template child maybe removed, so start from end.
        var children = [];
        for(var i= 0; i< info.node.children.length; i++)
            children.push(info.node.children[i]);
        for (var i = 0; i< children.length; i++) {
            var childInfo = internalTie(children[i], dataContext, contextPath);
            if(childInfo)
                info.childrenInfo.push(childInfo);
        }
        if (info.options.binding || info.options.actions) {
            applyKnots(info);
        }

        return info;
    }


    ////////////////////////
    //untie
    //////////////////////
    function removeKnot(knotInfo) {
        for (var valueName in knotInfo.options.binding) {
            if(valueName == "foreach")
                continue;
            var knotType = __private.Extension.findProperKnotType(knotInfo.node, valueName);
            if (!knotType) {
                throw new Error("Failed to find the proper knot type1 tag:" + knotInfo.node.tagName + " type:" + valueName);
            }
            knotType.setValue(knotInfo.node, valueName, undefined);
        }

        if (knotInfo.options.twoWayBinding)
            removeDataNotification(knotInfo);

        if(knotInfo.options.actions)
            releaseActions(knotInfo);
    }

    function releaseActions(knotInfo){
        for(var action in knotInfo.options.actions){
            if(action == "itemCreated")
                continue;
            var actionType = __private.Extension.findProperActionType(knotInfo.node, action);
            if(actionType && knotInfo.options.actions[action]){
                actionType.releaseAction(knotInfo.node, action, knotInfo.actionCallbacks[action]);
            }
        }
    }

    function removeDataNotification(knotInfo) {
        for (var valueName in knotInfo.options.twoWayBinding) {
            var pathSections = knotInfo.options.binding[valueName].split(".");
            var path = "";
            for (var i = 0; i < pathSections.length +1; i++) {
                var curData = knotInfo.dataContext;
                if (path != "") {
                    curData = knotInfo.dataContext[pathSections[i]]
                }
                if (!curData)
                    break;

                __private.DataEventMgr.unregister(curData, knotInfo);

                if(pathSections.length > i){
                    if (path != "")
                        path += ".";
                    path += pathSections[i];
                }
            }

            if (knotInfo.nodeMonitoringInfo && knotInfo.nodeMonitoringInfo[valueName]) {
                var knotType = __private.Extension.findProperKnotType(knotInfo.node, valueName);
                knotType.stopMonitoring(knotInfo.node, knotInfo.nodeMonitoringInfo[valueName]);
            }
        }
    }



    function untie(docNode) {
        var info = docNode.__knotInfo;
        if (!info)
            return;

        if (info.childrenInfo) {
            for (var i = 0; i < info.childrenInfo.length; i++) {
                untie(info.childrenInfo[i].node);
            }
        }
        removeKnot(info);
        delete docNode.__knotInfo;
    }


    function validate(onComplete) {
        var docNode = document.body;

        var defferedObjects = [];
        var errMsg = internalValidate(docNode, defferedObjects);

        if(defferedObjects.length > 0){
            if(!onComplete)
                throw new Error("Asynchronous validation detected, but isn't called as asynchronous method.");
            var finishedCount  =0;
            var errMsg = null;
            for(var i=0; i < defferedObjects.length; i++){
                var done = function(msg){
                    if(!errMsg && msg){
                        errMsg = msg;
                    }
                    finishedCount++;
                    if(finishedCount == defferedObjects.length)
                        onComplete(errMsg);
                }
                defferedObjects[i].done(done, done);
            }
        }
        else{
            if(onComplete)
                onComplete(errMsg);
            else
                return errMsg;
        }
    }
    function internalValidate(docNode, defferedObjects){
        var info = docNode.__knotInfo;
        if (!info)
            return;

        if (info.options.validators) {
            for (var v in info.options.validators) {
                var fullPath = info.options.binding[v];
                var arr = fullPath.split(".");
                var propertyName = arr[arr.length - 1];
                var objectPath = fullPath.substr(0, fullPath.length - propertyName.length - 1);
                if (!__private.Utility.getValueOnPath(info.dataContext, objectPath))
                    continue;
                var knotType = __private.Extension.findProperKnotType(info.node, v);
                var newValue = knotType.getValue(info.node, v);
                var res = validateValue(info, v, newValue, defferedObjects);
                if(res instanceof __private.Deffered){
                    defferedObjects.push(res);
                }
                else{
                    if (res)
                        return res;
                }
            }
        }

        if (info.childrenInfo) {
            for (var i = 0; i < info.childrenInfo.length; i++) {
                var errorMessage = internalValidate(info.childrenInfo[i].node, defferedObjects);
                if (errorMessage)
                    return errorMessage;
            }
        }
        return;
    }



    ////////////////////////////
    //Export
    //Replace the old Knot namespace object to seal the private variables
    ////////////////////////////
    Knot = {
        tie: tie,
        untie: untie,
        tieNode: internalTie,
        cloneNode: cloneTemplateNode,
        validate:validate,
        registerKnotExtension: function(ext, type){
            __private.Extension.register(ext, type);
        },

        registerOnValidating: function(errorCallback){
            __private.Validating.onValidatingCallbacks.push(errorCallback);
        },
        unregisterOnValidatingError: function (errorCallback) {
            __private.Validating.onValidatingCallbacks.splice(__private.Validating.onValidatingCallbacks.indexOf(errorCallback), 1);
        },

        notifyDataChanged:function(data, propertyName)
        {
            __private.DataEventMgr.notifyDataChanged(data, propertyName);
        },
        setValue: function (data, property, value) {
            data[property] = value;
            __private.DataEventMgr.notifyDataChanged(data, property);
        },
        addToArray: function (array, data) {
            array.push(data);
            __private.DataEventMgr.notifyDataChanged(array);
            __private.DataEventMgr.notifyDataChanged(array, "length");
        },
        removeFromArray: function (array, data) {
            array.splice(array.indexOf(data), 1);
            __private.DataEventMgr.notifyDataChanged(array);
            __private.DataEventMgr.notifyDataChanged(array, "length");
        },

        __registerKnotDebugger: function(dbg){
            __private.knotDebugger = dbg;
        },

        monitorData:function(data, from, callback){
            __private.DataEventMgr.register(data, from, function(property){
                callback(data, property);
            })
        },
        stopMonitoringData: function(data, from){
            __private.DataEventMgr.unregister(data, from);
        },

        getPropertyChangeRecord: function(data){
            return __private.DataEventMgr.getPropertyChangeRecord(data);
        },
        resetPropertyChangeRecord: function(data){
            __private.DataEventMgr.resetPropertyChangeRecord(data);
        }
    }
})();