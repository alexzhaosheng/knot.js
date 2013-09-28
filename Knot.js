/*!
 * knot.js core
 * 
 * Copyright 2013 Sheng(Alex) Zhao 
 * Released under the MIT license 
 * 
 */

(function (root) {
    if (!root)
        root = window;

    
    /////////////////////////////////////
    // Utility functions
    /////////////////////////////////////
    function isEmptyObj(obj) {
        for (var p in obj) {
            return false;
        }
        return true;
    }

    function trim(s) {
        return s.replace(/^\s+|\s+$/g, "");
    }

    function getValueOnPath(rootData, path) {
        var data = rootData;
        while (path.indexOf(".") >= 0 && rootData) {
            data = data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if (data)
            return data[path];
        return undefined;
    }

    function getObjectInGlobalSpace(path) {
        var arr = path.split(".");
        var o = window;
        for (var i = 0 ; i < arr.length; i++) {
            o = o[arr[i]];
        }
        return o;
    }

    /////////////////////////////////////
    // Attached data management
    /////////////////////////////////////
    var _dataInMonitoring = [];
    var _attachedInfoOfData = [];
    function getAttachedInfo(data) {
        if (_dataInMonitoring.indexOf(data) < 0) {
            _dataInMonitoring.push(data);
            _attachedInfoOfData[_dataInMonitoring.indexOf(data)] = {};
        }
        return _attachedInfoOfData[_dataInMonitoring.indexOf(data)];
    }
    function releaseAttachedInfo(data) {
        var index = _dataInMonitoring.indexOf(data);
        if (index >= 0) {
            delete _dataInMonitoring[index];
            delete _attachedInfoOfData[index];
        }
    }

    ///////////////////////////////////////////////////////
    // Value changed callbacks management
    ///////////////////////////////////////////////////////
    function registerValueChangedCallback(data, knotInfo, callback) {
        var attachedInfo = getAttachedInfo(data);
        if (!attachedInfo.changedCallbacks) {
            attachedInfo.changedCallbacks = [];
        }
                
        attachedInfo.changedCallbacks.push({ knotInfo: knotInfo, callback: callback });
    }
    function unregisterValueChangedCallback(data, knotInfo) {
        var attachedInfo = getAttachedInfo(data);
        if (!attachedInfo.changedCallbacks)
            return;       
        for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
            if (attachedInfo.changedCallbacks[i].knotInfo == knotInfo) {
                attachedInfo.changedCallbacks.splice(i, 1);
                break;
            }
        }
        if (attachedInfo.changedCallbacks.length == 0) {
            delete attachedInfo.changedCallbacks;
            if(isEmptyObj(attachedInfo))
                releaseAttachedInfo(data);
        }
    }
    function hasRegisteredValuChangedCallback(data, knotInfo) {
        var attachedInfo = getAttachedInfo(data);
        if (attachedInfo.changedCallbacks) {
            for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                if (attachedInfo.changedCallbacks[i].knotInfo == knotInfo) {                    
                    return true;
                }
            }
        }
        return false;
    }
    function notifyDataChanged(data, propertyName) {
        var attachedInfo = getAttachedInfo(data);
        if (attachedInfo.changedCallbacks) {
            for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                attachedInfo.changedCallbacks[i].callback(propertyName);
            }
        }
    }


    ///////////////////////////////////////////////////////
    // Validating management
    ///////////////////////////////////////////////////////
    var _onValidatingErrorCallbacks = [];

    function setErrorInfo(data, property, errorMessage) {
        var attachedInfo = getAttachedInfo(data);
        //if nobody is lisening, simple ignore
        if (!attachedInfo.validating)
            return;


        if (!attachedInfo.validating.currentErrorMessages[property] && !errorMessage)
            return;

        attachedInfo.validating.currentErrorMessages[property] = errorMessage;
        for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
            attachedInfo.validating.callbacks[i].callback(property);
        }
    }
    function getErrorInfo(data, property){
        var attachedInfo = getAttachedInfo(data);        
        if (!attachedInfo.validating)
            return null;
        return attachedInfo.validating.currentErrorMessages[property];
    }
    function registerOnErrorCallback(data, knotInfo, callback) {
        var attachedInfo = getAttachedInfo(data);
        
        if (!attachedInfo.validating) {
            attachedInfo.validating = {callbacks:[], currentErrorMessages:[]};
        }             
        
        attachedInfo.validating.callbacks.push({ knotInfo: knotInfo, callback: callback });
    }
    function unregisterOnErrorCallback(data, knotInfo) {
        var attachedInfo = getAttachedInfo(data);
        if (!attachedInfo.validating)
            return;
        for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
            if (attachedInfo.validating.callbacks[i].knotInfo == knotInfo) {
                attachedInfo.validating.callbacks.splice(i, 1);
                break;
            }
        }
        if (attachedInfo.validating.callbacks.length == 0) {
            delete attachedInfo.validating;
            if (isEmptyObj(attachedInfo))
                releaseAttachedInfo(data);
        }
    }
    function hasRegisteredOnErrorCallback(data, knotInfo) {
        var attachedInfo = getAttachedInfo(data);
        if (!attachedInfo.validating) {
            return false;
        }
        if (attachedInfo.validating.callbacks) {
            for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
                if (attachedInfo.validating.callbacks[i].knotInfo == knotInfo) {
                    return true;
                }
            }
        }
        return false;
    }
       

    ///////////////////////////////////////////////////////
    // Knot types
    ///////////////////////////////////////////////////////
    var _knotTypes = [];
    function findProperKnotType(tagName, valueName) {
        for (var i = 0; i < _knotTypes.length; i++) {
            if (_knotTypes[i].isSupported(tagName, valueName)) {
                return _knotTypes[i];
            }
        }
        return null;
    }
    function registerKnotType(knotType) {
        _knotTypes.push(knotType);
    }


    ///////////////////////////////////////////////////////
    // Parse options
    ///////////////////////////////////////////////////////
    function parseOptionToJSON(option) {
        if (!option)
            return {};
        option = option.replace(/\s/g, "");
        option = "{" + option + "}";
        option = option.replace(/:/g, '":"').replace(/,/g, '","').replace(/}/g, '"}').replace(/{/g, '{"').replace(/"{/g, "{").replace(/}"/g, "}");
        return JSON.parse(option);
    }
    function parseDetailedOptions(optionName, detailedOptions, valueConverters, validators) {
        var vcS = detailedOptions.indexOf("=>");
        var vlS = detailedOptions.indexOf("=!");

        var vcE = (vlS > vcS ? vlS : detailedOptions.length) - 1;
        var vlE = (vcS > vlS ? vcS : detailedOptions.length) - 1;

        var pE
        if (vcS > 0 && vlS > 0)
            pE = Math.max(vcS, vlS)
        else
            pE = Math.max(vcS, vlS) - 1;
        if (pE < 0)
            return detailedOptions;
        
        if (vcS >= 0) 
            valueConverters[optionName] = detailedOptions.substr(vcS + 2, vcE - vcS - 1);
        
        if (vlS >= 0)
            validators[optionName] = detailedOptions.substr(vlS + 2, vlE - vlS-1).split("&");
        
        return detailedOptions.substr(0, pE+1);
    }

    function parseOptions(node) {
        var options = {};
        var att = node.getAttribute("knots");
        if (att) {           
            var bindingOptions = parseOptionToJSON(att);
            if (bindingOptions.style) {
                var v = bindingOptions.style;
                delete bindingOptions.style;
                for (var s in v) {
                    bindingOptions["style-" + s] = v[s];
                }
            }
            options.binding = bindingOptions;

            var valueConverters = {}, twoWayBinding = {}, validators = {}, bindingToError = {};            
            for (var p in options.binding) {                
                var v = options.binding[p];
                if (v[0] == "*") {
                    twoWayBinding[p] = true;
                    v = v.substr(1);                    
                }
                if (v[0] == "!") {
                    bindingToError[p] = true;
                    twoWayBinding[p] = true;
                    v = v.substr(1);
                }

                options.binding[p] = parseDetailedOptions(p, v, valueConverters, validators);                   
            }
            if(!isEmptyObj(valueConverters))
                options.valueConverters = valueConverters;
            if(!isEmptyObj(twoWayBinding))
                options.twoWayBinding = twoWayBinding;
            if (!isEmptyObj(bindingToError))
                options.bindingToError = bindingToError;
            if (!isEmptyObj(validators))
                options.validators = validators;
        }

        if (node.getAttribute("knotEvents")) {
            options.events = parseOptionToJSON(node.getAttribute("knotEvents"));
        }
        
        return options;
    }

    ///////////////////////////////////////////////////////////
    // core
    ///////////////////////////////////////////////////////////

    //synchronise the items between array and dom node children, create new, remove old and change order.
    function syncItems(knotInfo, items) {
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
            
        for (var i = 0; i < items.length; i++) {
            var ele = findChild(node, items[i]);
            if (ele) {
                if (Array.prototype.indexOf.call(node.children, ele) != i) {
                    node.removeChild(ele);
                    addChildTo(node, ele, i);
                }
            }
            else {
                var n = node.knotItemTemplate.cloneNode(true);
                knotInfo.childrenInfo.push(tie(n, items[i]));
                addChildTo(node, n, i);
                if (knotInfo.options.events && knotInfo.options.events.onItemCreated) {
                    var callback = getObjectInGlobalSpace(knotInfo.options.events.onItemCreated);
                    if (!callback)
                        throw new Error("Failed to find event handler with name:" + knotInfo.options.events.onItemCreated);
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
    
    function applyKnots(knotInfo) {        
        if (knotInfo.options.twoWayBinding)
            setupDataNotification(knotInfo);

        for (var valueName in knotInfo.options.binding) {
            //foreach is treaded as a special knot
            if (valueName == "foreach")
                continue;
            
            updateDisplay(knotInfo, valueName);
        }        
    }
    function updateDisplay(knotInfo, valueName) {
        var path = knotInfo.options.binding[valueName];
                   
        var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
        if (!knotType) {
            throw new Error("Failed to find the proper knot type!");
        }       
        
       
        knotType.setValue(knotInfo.node, valueName, getDataValue(knotInfo, valueName));        
    }

    function setupDataNotification(knotInfo) {
        var data = knotInfo.dataContext;        
        for (var valueName in knotInfo.options.twoWayBinding) {
            if (valueName == "foreach")
                continue;

            if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
                var fullPath = knotInfo.options.binding[valueName];
                var arr = fullPath.split(".");
                var propertyName = arr[arr.length - 1];
                var objectPath = fullPath.substr(0, fullPath.length - propertyName.length-1);
                var dataToBinding = getValueOnPath(data, objectPath);
                if (dataToBinding) {
                    if (!hasRegisteredOnErrorCallback(dataToBinding)) {
                        (function () {
                            var curValueName = valueName, curObjectPath = curObjectPath, curProperty = propertyName;

                            registerOnErrorCallback(dataToBinding, knotInfo, function (property) {
                                for (var v in knotInfo.options.bindingToError) {
                                    if (knotInfo.options.binding[v].substr(0, objectPath.length) == objectPath) {
                                        if (property == knotInfo.options.binding[v].substr(objectPath.length+1))
                                            updateDisplay(knotInfo, v);
                                    }
                                }
                            });
                        })();                        
                    }
                    continue;
                }
            }

            
            var pathSections = knotInfo.options.binding[valueName].split(".");
            var path = "";        
            for (var i = 0; i < pathSections.length; i++) {
                var curData = knotInfo.dataContext;
                if (path != ""){
                    curData = knotInfo.dataContext[path]                    
                }
                if (!curData)
                    break;
               
                if (!hasRegisteredValuChangedCallback(curData, knotInfo)) {
                    (function () {
                        var curPath = path;
                        registerValueChangedCallback(curData, knotInfo, function (propertyName) {
                            var fullPath = propertyName;
                            if (curPath != "")
                                fullPath = curPath + "." + propertyName;

                            for (var p in knotInfo.options.twoWayBinding) {
                                var path = knotInfo.options.binding[p];
                                if(path.length < fullPath.length){
                                    continue;
                                }
                                else if(fullPath == path){
                                    updateDisplay(knotInfo, p);
                                }
                                else if (fullPath == path.substr(0, fullPath.length)) {
                                    setupDataNotification(knotInfo);
                                    updateDisplay(knotInfo, p);
                                }
                            }
                        });
                    })();
                }              

                if(path != "")
                    path += ".";
                path += pathSections[i];
            }   
            
            var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
            if (knotType.isEditingSupported(knotInfo.node.tagName, valueName)) {
                setupNodeMonitering(knotInfo, knotType, valueName);
            } 
        }                    
    }

    function setupNodeMonitering(knotInfo, knotType, valueName) {       
        if (!knotInfo.nodeMonitoringInfo) {
            knotInfo.nodeMonitoringInfo = {};
        }
        if (!knotInfo.nodeMonitoringInfo[valueName]) {
            knotInfo.nodeMonitoringInfo[valueName] = function () {
                var newValue = knotType.getValue(knotInfo.node, valueName);

                if (knotInfo.options.validators && knotInfo.options.validators[valueName]) {
                    if (validateValue(knotInfo, valueName, newValue))
                        return;
                }
                setDataValue(knotInfo, valueName, newValue);
            };
            knotType.monitorChange(knotInfo.node, valueName, knotInfo.nodeMonitoringInfo[valueName]);
        }        
    }
    
    function validateValue(knotInfo, valueName, value) {
        var data = knotInfo.dataContext;
        var path = knotInfo.options.binding[valueName];
        while (path.indexOf(".") >= 0 && data) {
            data = data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if (!data)
            return;

        for (var i = 0; i < knotInfo.options.validators[valueName].length; i++) {            


            var validator = getObjectInGlobalSpace(knotInfo.options.validators[valueName][i]);
            if (!validator) {
                throw new Error("Failed to find validator by path:" + knotInfo.options.validators[valueName][i]);
            }
            var errMessage;
            try {
                errMessage = validator(value, data);
            }
            catch (err) {
                errMessage = err.message;
            }
            
            setErrorInfo(data, path, errMessage);
            if (errMessage) {                
                for (var i = 0; i < _onValidatingErrorCallbacks.length; i++) {
                    _onValidatingErrorCallbacks[i](errMessage, knotInfo.node);
                }
                return errMessage;
            }
        }
        return null;
    }


    function getDataValue(knotInfo, valueName) {
        var path =knotInfo.options.binding[valueName];

        var value;        
        if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {            
            var arr = path.split(".");
            var propertyName = arr[arr.length - 1];
            var objectPath = path.substr(0, path.length - propertyName.length-1);
            var dataToBinding = getValueOnPath(knotInfo.dataContext, objectPath);
            value = getErrorInfo(dataToBinding, propertyName);
        }
        else{
            value = getValueOnPath(knotInfo.dataContext, path);
        }

               
        if (knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = getObjectInGlobalSpace(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.to) {
                value = converter.to(value);
            }
        }

        return value;
    }

    function setDataValue(knotInfo, valueName, value) {
        if (!knotInfo.dataContext)
            return;
        var path = knotInfo.options.binding[valueName]
        if (knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = getObjectInGlobalSpace(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.from) {
                value = converter.from(value);
            }
        }

        var data = knotInfo.dataContext;
        while (path.indexOf(".") >= 0 && data) {
            data= data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if(data){
            data[path] = value;            
        }               
        if(data)
            notifyDataChanged(data, path);
    }

    function findDataSource(option) {
        var res = null;
        if (option.selector) {
            res= document.querySelector(option.selector);
        }
        if (!res) {
            throw new Error("Can't find data source!");
        }
        return res;
    }

    function tie(docNode, dataContext) {
        if (docNode.__knotInfo) {
            untie(docNode);
        }
        var info = { node: docNode, dataContext: dataContext, childrenInfo: [] };
        docNode.__knotInfo = info;

        info.options = parseOptions(docNode);
        if (info.options.binding) {
            if (info.options.binding.foreach) {                             
                var foreach = getDataValue(info, "foreach");
                if (foreach != null) {
                    if (!(foreach instanceof Array)) {
                        throw new Error("'foreach' can only used on array!");
                    }
                    if(!docNode.knotItemTemplate){
                        docNode.knotItemTemplate = docNode.children[0];
                        if(!docNode.knotItemTemplate)
                            throw new Error("No item template find!");
                        docNode.removeChild(docNode.knotItemTemplate);
                    }

                    syncItems(info, foreach);
                    applyKnots(info);
                        
                    if (info.options.twoWayBinding && info.options.twoWayBinding.foreach) {
                        info.foreachArrayChangeCallback = function () { syncItems(info, foreach); };
                        registerValueChangedCallback(foreach, info, info.foreachArrayChangeCallback);
                    }
                }
            }
            else {
                for (var i = 0; i < docNode.children.length; i++) {
                    tie(docNode.children[i], dataContext);
                }
                applyKnots(info);
            }
            return info;
        }
           
        for (var i = 0; i < docNode.children.length; i++) {
            info.childrenInfo.push(tie(docNode.children[i], dataContext));
        }
        return info;
    }





    function removeKnot(knotInfo) {
        for (var valueName in knotInfo.options.binding) {
            
            var path = knotInfo.options.binding[valueName];
           
            //foreach has been processed outside
            if (valueName == "foreach")
                continue;

            var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
            if (!knotType) {
                throw new Error("Failed to find the proper knot type!");
            }
            knotType.setValue(knotInfo, valueName, undefined);
        }

        if (knotInfo.options.twoWayBinding)
            removeDataNotification(knotInfo);
    }

    function removeDataNotification(knotInfo) {
        var data = knotInfo.dataContext;
        for (var valueName in knotInfo.options.twoWayBinding) {
            if (valueName == "foreach")
                continue;

            var pathSections = knotInfo.options.binding[valueName].split(".");
            var path = "";
            for (var i = 0; i < pathSections.length; i++) {
                var curData = knotInfo.dataContext;
                if (path != "") {
                    curData = knotInfo.dataContext[pathSections[i]]
                }
                if (!curData)
                    break;

                unregisterValueChangedCallback(curData, knotInfo);               

                if (path != "")
                    path += ".";
                path += pathSections[i];
            }

            if (knotInfo.nodeMonitoringInfo && knotInfo.nodeMonitoringInfo[valueName]) {
                var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
                knotInfo.stopMonitoring(knotInfo.node, notInfo.nodeMonitoringInfo[valueName]);
            }
        }
    }



    function untie(docNode) {
        var info = docNode.__knotInfo;
        if (!info)
            return;
        
        if (info.options.binding && info.options.binding.foreach) {
            var foreach = getDataValue(info, "foreach");
            if (foreach != null && info.foreachArrayChangeCallback) {
                unregisterValueChangedCallback(foreach, info, info.foreachArrayChangeCallback);
            }
        }

        if (docNode.childrenInfo) {
            for (var i = 0; i < docNode.childrenInfo.length; i++) {
                untie(docNode.childrenInfo[i].node);
            }
        }

        removeKnot(info);
        delete docNode.__knotInfo;        
    }


    function validate(docNode) {
        var info = docNode.__knotInfo;
        if (!info)
            return;

        if (info.options.validators) {
            for (var v in info.options.validators) {
                var fullPath = info.options.binding[v];
                var arr = fullPath.split(".");
                var propertyName = arr[arr.length - 1];
                var objectPath = fullPath.substr(0, fullPath.length - propertyName.length - 1);
                if (!getValueOnPath(info.dataContext, objectPath))
                    continue;
                var knotType = findProperKnotType(info.node.tagName, v);
                var newValue = knotType.getValue(info.node, v);
                var errorMessage = validateValue(info, v, newValue);
                if (errorMessage)
                    return errorMessage;
            }
        }        

        if (info.childrenInfo) {
            for (var i = 0; i < info.childrenInfo.length; i++) {
                var errorMessage = validate(info.childrenInfo[i].node);
                if (errorMessage)
                    return errorMessage;
            }
        }
        return;
    }
   


    root.Knot = {              
        tie: tie,
        untie: untie,
        validate:validate,
        registerKnotType: registerKnotType,

        registerOnValidatingError: function(errorCallback){
            _onValidatingErrorCallbacks.push(errorCallback);
        },
        unregisterOnErrorValidatingError: function (errorCallback) {
            _onValidatingErrorCallbacks.splice(_onValidatingErrorCallbacks.indexOf(errorCallback), 1);
        },

        notifyDataChanged:notifyDataChanged,
        setValue: function (data, property, value) {
            data[property] = value;
            notifyDataChanged(data, property);
        },
        addToArray: function (array, data) {
            array.push(data);
            notifyDataChanged(array);
        },
        removeFromArray: function (array, data) {
            array.splice(array.indexOf(data), 1);
            notifyDataChanged(array);
        }
    }
})();
