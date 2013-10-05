/*!
 * knot.js core
 * www.knotjs.com
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
        if(path[0] == "/"){
            data= window;
            path = path.substr(1);
        }
        while (path.indexOf(".") >= 0 && data) {
            data = data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if (data)
            return data[path];
        return undefined;
    }

    function getObjectInGlobalScope(path) {
        var arr = path.split(".");
        var o = window;
        for (var i = 0 ; i < arr.length; i++) {
            o = o[arr[i]];
        }
        return o;
    }

    function getBlockInfo(str, startIndex, startMark, endMark){
        var info = {start:-1, end:-1};
        info.start = str.indexOf(startMark, startIndex);
        if(info.start<0)
            return null;

        var ct = 0;
        var pos = info.start+1;
        while(true){
            var ns = str.indexOf(startMark, pos);
            var ne = str.indexOf(endMark, pos);
            if(ne<0)
                break;
            if(ns<0 || ne < ns){
                if(ct==0){
                    info.end = ne;
                    break;
                }
                else{
                    ct--;
                }
                pos = ne+1;
            }
            else{
                ct++;
                pos = ns+1;
            }
        }
        if(info.start >=0 && info.end>=0)
            return info;
        else{
            return null;
        }
    }

    /////////////////////////////////////
    //mock debugger. will be replaced if debugger is actived
    ////////////////////////////////////
    var knotDebugger = {
        debug:function(knotInfo, valueName, status){}
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
    // Knot extensions
    ///////////////////////////////////////////////////////
    var _knotTypes = [];
    var _actions = [];

    function registerKnotExtension(ext, type) {
        //always insert the extensions to the first. So that the extensions that registered lately
        //would overwrite the previous ones.
        if(type == "knot_type")
            _knotTypes.splice(0, 0, ext);
        if(type == "knot_action")
            _actions.splice(0, 0, ext);
    }
    function findProperKnotType(tagName, valueName) {
        for (var i = 0; i < _knotTypes.length; i++) {
            if (_knotTypes[i].isSupported(tagName, valueName)) {
                return _knotTypes[i];
            }
        }
        return null;
    }

    function findProperActionType(tagName, actionName) {
        for (var i = 0; i < _actions.length; i++) {
            if (_actions[i].isSupported(tagName, actionName)) {
                return _actions[i];
            }
        }
        return null;
    }


    /////////////////////////////////
    //CBS handling
    ////////////////////////////////
    function removeComments(text){
        var pos;
        while((pos = text.indexOf("/*")) >= 0){
            var np = text.indexOf("*/", pos);
            text = text.substr(0, pos) +text.substr(np + 2);
        }

        var lines = text.split("\n");
        var res = "";
        for(var i = 0; i< lines.length; i++){
            var sl = lines[i].split("\r");
            for(var j= 0; j < sl.length; j++){
                if(trim(sl[j]).substr(0, 2) == "//"){
                    continue;
                }
                res += sl[j];
            }
        }
        return res;
    }

    function cbsInit(){
        var blocks = document.querySelectorAll("script");
        for(var i =0; i< blocks.length; i++){
            if(blocks[i].type == "text/cbs"){
                applyCBS(removeComments(blocks[i].innerText));
            }
        }
    }
    function applyCBS(cbs){
        var parsePos = 0;
        cbs = cbs.replace(/\r/g," ").replace(/\n/g, " ");
        while(true){
            var block = getBlockInfo(cbs, parsePos, "{", "}");
            if(!block)
                return;

            var options = trim(cbs.substr(block.start+1, block.end-block.start-1));
            options = options.replace(/;/g, ",");
            if(options[options.length-1] == ",")
                options = options.substr(0, options.length-1);

            var selector = trim(cbs.substr(parsePos, block.start-parsePos));
            var seq = -1;
            if(selector[selector.lastIndexOf("[")-1] == " "){
                if(selector[selector.length-1] != "]"){
                    throw new Error("Unknown cbs selector " + selector);
                }
                seq = Number(selector.substr(selector.lastIndexOf("[")+1, selector.length - selector.lastIndexOf("[")-2));
                if(isNaN(seq)){
                    throw new Error("Unknown cbs selector " + selector);
                }

                selector = selector.substr(0, selector.lastIndexOf("["));
            }
            var elements = document.querySelectorAll(selector);
            if(elements.length == 0)
                throw new Error("No element matches the selector:" + selector);
            if(seq>=0){
                if(elements[seq])
                    elements[seq].__knot_cbs_options = (elements[seq].__knot_cbs_options?(elements[seq].__knot_cbs_options+";"+  options) :options);
                else
                    throw new Error("No element exists at this index. selector:" + selector);
            }
            else{
                for(var i= 0; i< elements.length; i++){
                    elements[i].__knot_cbs_options = (elements[i].__knot_cbs_options?(elements[i].__knot_cbs_options+";"+  options) :options)
                }
            }

            parsePos = block.end +1;
        }
    }

    ///////////////////////////////////////////////////////
    // Parse options
    ///////////////////////////////////////////////////////
    function parseOptionToJSON(option) {
        if (!option)
            return {};
        option = option.replace(/\s/g, "");
        option = "{" + option + "}";
        option = option.replace(/;/g,",").replace(/:/g, '":"').replace(/,/g, '","').replace(/}/g, '"}').replace(/{/g, '{"').replace(/"{/g, "{").replace(/}"/g, "}");
        try{
            return JSON.parse(option);
        }
        catch(err){
            throw new Error("Parse option failed:" +option + " message:"+err.message);
        }
    }
    function parseDetailedOptions(optionName, detailedOptions, valueConverters, validators) {
        var arr = detailedOptions.split("=");
        for (var i = 1; i < arr.length; i++) {
            if (arr[i][0] == ">")
                valueConverters[optionName] = arr[i].substr(1);
            if (arr[i][0] == "!")
                validators[optionName] = arr[i].substr(1).split("&");
        }
        return arr[0];
    }

    function parseOptions(node) {
        var options = {};
        var att = node.getAttribute("binding");
        if(node.__knot_cbs_options){
            if(att){
                att += ";" + node.__knot_cbs_options;
            }
            else{
                att=node.__knot_cbs_options;
            }
        }

        if (att) {
            var bindingOptions = parseOptionToJSON(att);
            if (bindingOptions.style) {
                var v = bindingOptions.style;
                delete bindingOptions.style;
                for (var s in v) {
                    bindingOptions["style-" + s] = v[s];
                }
            }
            var valueConverters = {}, twoWayBinding = {}, validators = {}, bindingToError = {}, actions={};
            for (var p in bindingOptions) {
                if(p[0] == "@"){
                    actions[p.substr(1)] = bindingOptions[p];
                    delete bindingOptions[p];
                }
                else if(p== "knotDataContext"){
                    options.dataContextPath = bindingOptions[p];
                    delete bindingOptions[p];
                }
                else{
                    var v = bindingOptions[p];
                    if (v[0] == "*") {
                        twoWayBinding[p] = true;
                        v = v.substr(1);
                    }
                    if (v[0] == "!") {
                        bindingToError[p] = true;
                        twoWayBinding[p] = true;
                        v = v.substr(1);
                    }
                    bindingOptions[p] = parseDetailedOptions(p, v, valueConverters, validators);
                }
            }
            if(!isEmptyObj(valueConverters))
                options.valueConverters = valueConverters;
            if(!isEmptyObj(twoWayBinding))
                options.twoWayBinding = twoWayBinding;
            if (!isEmptyObj(bindingToError))
                options.bindingToError = bindingToError;
            if (!isEmptyObj(validators))
                options.validators = validators;
            if(!isEmptyObj(actions)){
                options.actions = actions;
            }
            if(!isEmptyObj(bindingOptions))
                options.binding = bindingOptions;
        }
        return options;
    }

    ///////////////////////////////////////////////////////////
    // item template management and item sync
    ///////////////////////////////////////////////////////////
    function cloneTemplateNode(node){
        var setAttachedData = function(n, c){
            c.__knot_cbs_options = n.__knot_cbs_options;
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
            var template;
            var s = info.options.valueConverters["foreach"];
            if(_itemTemplates[s]){
                template =  _itemTemplates[s];
            }
            else{
                template = document.getElementById(s);
                if(template)
                    template.parentNode.removeChild(template);
                else{
                    template = getObjectInGlobalScope(s);
                    if(template && typeof(template) != "function"){
                        throw new Error("The item template must be a dom element or a callback function");
                    }
                }
            }
            if(!template)
                throw new Error("Failed to find item template with name:" + s);
            _itemTemplates[s] = template;
        }

        info.itemTemplate = template;
    }

    //synchronise the items between array and dom node children, create new, remove old and change order.
    function syncItems(knotInfo, items) {
        setupItemTemplate(knotInfo);

        knotDebugger.debug(knotInfo, "foreach", "sync, itemCount:" + (items? items.length:0));

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
                knotInfo.childrenInfo.push(tie(n, items[i], contextPath+".["+i+"]"));
                addChildTo(node, n, i);
                if (knotInfo.options.actions && knotInfo.options.actions.itemCreated) {
                    var callback = getObjectInGlobalScope(knotInfo.options.actions.itemCreated);
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


    ///////////////////////////////////////////////////////////
    // core
    ///////////////////////////////////////////////////////////

    function applyKnots(knotInfo) {
        if (knotInfo.options.twoWayBinding)
            setupDataNotification(knotInfo);

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
            var d = getValueOnPath(knotInfo.dataContext, knotInfo.options.binding[valueName])
            syncItems(knotInfo, d)
        }
        else{
            var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
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
                var actionType = findProperActionType(knotInfo.node.tagName, action);
                if(!actionType){
                    throw new Error("Failed to find the proper action type!  tag:" +knotInfo.node.tagName + " type:" + action);
                }
                var actionHandle =  getObjectInGlobalScope(knotInfo.options.actions[action]);
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
    function setupErrorNotification(knotInfo, valueName){
        var fullPath = knotInfo.options.binding[valueName];
        var arr = fullPath.split(".");
        var propertyName = arr[arr.length - 1];
        var objectPath = fullPath.substr(0, fullPath.length - propertyName.length-1);
        var dataToBinding = getValueOnPath(knotInfo.dataContext, objectPath);
        if (dataToBinding) {
            if (!hasRegisteredOnErrorCallback(dataToBinding)) {
                (function () {
                    registerOnErrorCallback(dataToBinding, knotInfo, function (property) {
                        for (var v in knotInfo.options.bindingToError) {
                            if (knotInfo.options.binding[v].substr(0, objectPath.length) == objectPath) {
                                if (property == knotInfo.options.binding[v].substr(objectPath.length+1))
                                    updateDisplay(knotInfo, v);
                            }
                        }
                    });
                    knotDebugger.debug(knotInfo,valueName, "setup");
                })();
            }
            return true;
        }
        return false;
    }


    function setupDataNotification(knotInfo) {
        var data = knotInfo.dataContext;
        for (var valueName in knotInfo.options.twoWayBinding) {
            if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
                if(setupErrorNotification(knotInfo, valueName))
                    continue;
            }

            var pathSections = knotInfo.options.binding[valueName].split(".");
            var path = "";
            for (var i = 0; i < pathSections.length + 1; i++) {
                var curData = knotInfo.dataContext;
                if (path != ""){
                    curData =getValueOnPath(knotInfo.dataContext, path)
                }
                if (!curData)
                    break;

                if(typeof(curData) != "object" && typeof(curData) != "array")
                    break;

                if (!hasRegisteredValuChangedCallback(curData, knotInfo)) {
                    (function () {
                        var curPath = path;
                        registerValueChangedCallback(curData, knotInfo, function (propertyName) {
                            var fullPath = propertyName;
                            if (curPath != ""){
                                if(propertyName)
                                    fullPath = curPath + "." + propertyName;
                                else
                                    fullPath = curPath;
                            }

                            for (var p in knotInfo.options.twoWayBinding) {
                                var path = knotInfo.options.binding[p];

                                //if the property is obtained from global scope, need to
                                //remove the first section to get the relative path
                                if(path[0] == "/"){
                                    path = path.substr(path.indexOf(".")+1);
                                }

                                if(path.length < fullPath.length){
                                    continue;
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

            if(valueName != "foreach"){
                var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
                if (knotType.isEditingSupported(knotInfo.node.tagName, valueName)) {
                    setupNodeMonitering(knotInfo, knotType, valueName);
                }
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

    /////////////////////// two way binding end ///////////////////////////////////////////

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


            var validator = getObjectInGlobalScope(knotInfo.options.validators[valueName][i]);
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

        var root = knotInfo.dataContext;
        if (path[0] == "/") {
            root = window;
            path = path.substr(1);
        }
        if (path == "--self")
            return knotInfo.dataContext;


        var value;
        if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
            var arr = path.split(".");
            var propertyName = arr[arr.length - 1];
            var objectPath = path.substr(0, path.length - propertyName.length-1);
            var dataToBinding = getValueOnPath(root, objectPath);
            value = getErrorInfo(dataToBinding, propertyName);
        }
        else{
            value = getValueOnPath(root, path);
        }

        if (valueName != "foreach" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.to) {
                value = converter.to(value);
            }
        }

        knotDebugger.debug(knotInfo, valueName, "get: " + (value instanceof Array? "{array:("+value.length+")}":value));

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

        if (valueName != "foreach" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
            if (!converter)
                throw new Error("Failed to find converter with name:" + knotInfo.options.valueConverters[valueName]);
            if (converter.from) {
                value = converter.from(value);
            }
        }

        var data = root;
        while (path.indexOf(".") >= 0 && data) {
            data= data[path.substr(0, path.indexOf("."))];
            path = path.substr(path.indexOf(".") + 1);
        }
        if(data){
            data[path] = value;
            knotDebugger.debug(knotInfo, valueName, "set:" + value);
        }
        if(data)
            notifyDataChanged(data, path);
    }


    var _isInitialized = false;
    function tie(docNode, dataContext, contextPath) {
        if(!_isInitialized){
            cbsInit();
            _isInitialized = true;
        }

        if(!docNode)
            docNode = document.body;
        if (docNode.__knotInfo) {
            untie(docNode);
        }
        if(!contextPath)
            contextPath = "/";
        var info = { node: docNode, childrenInfo: [], contextPath: contextPath };
        docNode.__knotInfo = info;

        info.options = parseOptions(docNode);
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
            dataContext = getValueOnPath(root, path);
        }
        info.dataContext = dataContext;

        if(info.options.binding && info.options.binding.foreach){
            setupItemTemplate(info);
        }
        for (var i = 0; i < docNode.children.length; i++) {
            info.childrenInfo.push(tie(docNode.children[i], dataContext, contextPath));
        }
        if (info.options.binding) {
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
            var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
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
            var actionType = findProperActionType(knotInfo.node.tagName, action);
            if(actionType && knotInfo.actionCallbacks[action]){
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

                unregisterValueChangedCallback(curData, knotInfo);

                if(pathSections.length > i){
                    if (path != "")
                        path += ".";
                    path += pathSections[i];
                }
            }

            if (knotInfo.nodeMonitoringInfo && knotInfo.nodeMonitoringInfo[valueName]) {
                var knotType = findProperKnotType(knotInfo.node.tagName, valueName);
                knotType.stopMonitoring(knotInfo.node, notInfo.nodeMonitoringInfo[valueName]);
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



    ////////////////////////////
    //export
    ////////////////////////////
    root.Knot = {
        tie: tie,
        untie: untie,
        validate:validate,
        registerKnotExtension: registerKnotExtension,

        registerOnValidatingError: function(errorCallback){
            _onValidatingErrorCallbacks.push(errorCallback);
        },
        unregisterOnValidatingError: function (errorCallback) {
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
            notifyDataChanged(array, "length");
        },
        removeFromArray: function (array, data) {
            array.splice(array.indexOf(data), 1);
            notifyDataChanged(array);
            notifyDataChanged(array, "length");
        },

        __registerKnotDebugger: function(dbg){
            knotDebugger = dbg;
        }
    }
})();