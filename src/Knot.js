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
    var Utility ={
        isEmptyObj: function(obj) {
            for (var p in obj) {
                return false;
            }
            return true;
        },

        trim: function (s) {
            return s.replace(/^\s+|\s+$/g, "");
        },

        getValueOnPath: function(rootData, path) {
            if(path =="")
                return rootData;

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
        },


        getObjectInGlobalScope: function(path) {
            if(path.substr(0, "--knot--globalFunc-".length) == "--knot--globalFunc-"){
                var id = Number(path.substr("--knot--globalFunc-".length));
                return this._knotGlobalFunction[id];
            }
            var arr = path.split(".");
            var o = window;
            for (var i = 0 ; i < arr.length; i++) {
                o = o[arr[i]];
            }
            return o;
        },
        _knotGlobalFunction: [],
        registerKnotGlobalFunction: function(func){
            this._knotGlobalFunction.push(func);
            return "--knot--globalFunc-"+ (this._knotGlobalFunction.length-1);
        },


        getBlockInfo: function(str, startIndex, startMark, endMark){
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
    var AttachedData = {
        _dataInMonitoring: [],
        _attachedInfoOfData: [],
        getAttachedInfo: function(data) {
            if (this._dataInMonitoring.indexOf(data) < 0) {
                this._dataInMonitoring.push(data);
                this._attachedInfoOfData[this._dataInMonitoring.indexOf(data)] = {};
            }
            return this._attachedInfoOfData[this._dataInMonitoring.indexOf(data)];
        },
        releaseAttachedInfo: function(data) {
            var index = this._dataInMonitoring.indexOf(data);
            if (index >= 0) {
                delete this._dataInMonitoring[index];
                delete this._attachedInfoOfData[index];
            }
        }
    };


    ///////////////////////////////////////////////////////
    // Value changed callbacks management
    ///////////////////////////////////////////////////////
    var DataMonitor = {
        register: function(data, knotInfo, callback) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
            if (!attachedInfo.changedCallbacks) {
                attachedInfo.changedCallbacks = [];
            }

            attachedInfo.changedCallbacks.push({ knotInfo: knotInfo, callback: callback });
        },
        unregister: function(data, knotInfo) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
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
                if(Utility.isEmptyObj(attachedInfo))
                    AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegistered: function(data, knotInfo) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks) {
                for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                    if (attachedInfo.changedCallbacks[i].knotInfo == knotInfo) {
                        return true;
                    }
                }
            }
            return false;
        },
        notifyDataChanged: function(data, propertyName) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
            if (attachedInfo.changedCallbacks) {
                for (var i = 0; i < attachedInfo.changedCallbacks.length; i++) {
                    attachedInfo.changedCallbacks[i].callback(propertyName);
                }
            }
        }
    }


    ///////////////////////////////////////////////////////
    // Validating management
    ///////////////////////////////////////////////////////
    var Validating = {
        onValidatingErrorCallbacks: [],

        setError: function(data, property, errorMessage) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
            //if nobody is lisening, simple ignore
            if (!attachedInfo.validating)
                return;


            if (!attachedInfo.validating.currentErrorMessages[property] && !errorMessage)
                return;

            attachedInfo.validating.currentErrorMessages[property] = errorMessage;
            for (var i = 0; i < attachedInfo.validating.callbacks.length; i++) {
                attachedInfo.validating.callbacks[i].callback(property);
            }
        },
        getError: function(data, property){
            var attachedInfo = AttachedData.getAttachedInfo(data);
            if (!attachedInfo.validating)
                return null;
            return attachedInfo.validating.currentErrorMessages[property];
        },
        registerOnError: function(data, knotInfo, callback) {
            var attachedInfo = AttachedData.getAttachedInfo(data);

            if (!attachedInfo.validating) {
                attachedInfo.validating = {callbacks:[], currentErrorMessages:[]};
            }

            attachedInfo.validating.callbacks.push({ knotInfo: knotInfo, callback: callback });
        },
        unregisterOnError: function(data, knotInfo) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
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
                if (Utility.isEmptyObj(attachedInfo))
                    AttachedData.releaseAttachedInfo(data);
            }
        },
        hasRegisteredOnError: function(data, knotInfo) {
            var attachedInfo = AttachedData.getAttachedInfo(data);
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
    };

    ///////////////////////////////////////////////////////
    // Knot extensions
    ///////////////////////////////////////////////////////
    var Extension = {
        _knotTypes:[],
        _actions: [],

        register: function(ext, type) {
            //always insert the extensions to the first. So that the extensions that registered lately
            //would overwrite the previous ones.
            if(type == "knot_type")
                this._knotTypes.splice(0, 0, ext);
            if(type == "knot_action")
                this._actions.splice(0, 0, ext);
        },
        findProperKnotType: function(tagName, valueName) {
            for (var i = 0; i < this._knotTypes.length; i++) {
                if (this._knotTypes[i].isSupported(tagName, valueName)) {
                    return this._knotTypes[i];
                }
            }
            throw new Error("Failed to find knot type! tag:" + tagName + " binding type:" + valueName);
        },

        findProperActionType: function(tagName, actionName) {
            for (var i = 0; i < this._actions.length; i++) {
                if (this._actions[i].isSupported(tagName, actionName)) {
                    return this._actions[i];
                }
            }
            return null;
        }
    }



    /////////////////////////////////
    //CBS handling
    ////////////////////////////////
    var CBS = {
        removeComments: function(text){
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
                    if(Utility.trim(sl[j]).substr(0, 2) == "//"){
                        continue;
                    }
                    res += sl[j];
                }
            }
            return res;
        },
        getXhrs: function(){
            if (window.XMLHttpRequest){
                return new XMLHttpRequest();
            }
            else{
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
        },
        cbsInit: function(onFinish, onError){
            var blocks = document.querySelectorAll("script");
            var scriptToLoad = 0;
            var check = function(){
                if(scriptToLoad == 0 && onFinish)
                    onFinish();
            }
            var that =this;
            for(var i =0; i< blocks.length; i++){
                if(blocks[i].type == "text/cbs"){
                    if(blocks[i].src){
                        scriptToLoad ++;
                        (function(){
                            var src = blocks[i].src;
                            var hr = that.getXhrs();
                            hr.onreadystatechange = function(){
                                if(hr.readyState == 4){
                                    if(hr.status == 200){
                                        try{
                                            that.applyCBS(hr.responseText);
                                            scriptToLoad--;
                                            check();
                                        }
                                        catch(err){
                                            if(onError) onError("Load CBS script error. url:" + src + " message:"  + err.message)
                                        }
                                    }
                                    else{
                                        if(onError) onError("Load CBS script error. url:" + src + " message:" +hr.statusText);
                                    }
                                }
                            }
                            hr.open("GET", src, true);
                            hr.send();
                        })();
                    }
                    else{
                        try{
                            this.applyCBS(this.removeComments(blocks[i].innerText));
                        }
                        catch(err){
                            if(onError) onError("Load CBS block error. " + err.message);
                        }
                    }
                }
            }

            check();
        },
        applyCBS: function(cbs){
            var parsePos = 0;
            cbs = cbs.replace(/\r/g," ").replace(/\n/g, " ");
            cbs = OptionParser.processEmbeddedFunction(cbs);
            while(true){
                var block = Utility.getBlockInfo(cbs, parsePos, "{", "}");
                if(!block)
                    return;

                var options = Utility.trim(cbs.substr(block.start+1, block.end-block.start-1));
                options = options.replace(/;/g, ",");
                if(options[options.length-1] == ",")
                    options = options.substr(0, options.length-1);

                var selector = Utility.trim(cbs.substr(parsePos, block.start-parsePos));
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
                try{
                    var elements = document.querySelectorAll(selector);
                }
                catch(err){
                    throw new Error("Query selector failed. selector:" + selector + " message:" + err.message);
                }
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
    }
    ///////////////////////////////////////////////////////
    // Parse options
    ///////////////////////////////////////////////////////
    var OptionParser = {
        processEmbeddedFunction: function(options){
            var pos = 0;
            while(true){
                var info = Utility.getBlockInfo(options, pos, "${<<", ">>}");
                if(!info)
                    return options;

                var funcStr = options.substr(info.start + 4, info.end-info.start - 4);
                funcStr = "(function(){" + funcStr + "})";
                try{
                    var func = eval(funcStr)
                }
                catch(err){
                    throw new Error("Parse embedded function failed. message:" + err.message + "function:" + funcStr);
                }
                var funcName = "$" + Utility.registerKnotGlobalFunction(func);
                options = [options.substr(0, info.start), funcName, options.substr(info.end+3)].join("");

                pos = info.end+3;
            }
        },
        parseOptionToJSON: function(option) {
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
        },
        parseDetailedOptions: function(optionName, detailedOptions, valueConverters, validators) {
            var arr = detailedOptions.split("=");
            for (var i = 1; i < arr.length; i++) {
                if (arr[i][0] == ">")
                    valueConverters[optionName] = arr[i].substr(1);
                if (arr[i][0] == "!")
                    validators[optionName] = arr[i].substr(1).split("&");
            }
            return arr[0];
        },

        parse: function(node) {
            if(node.__knot_parsedOptions){
                return node.__knot_parsedOptions;
            }
            var options = {};
            var att = node.getAttribute("binding");
            if(att){
                att = this.processEmbeddedFunction(att);
            }
            if(node.__knot_cbs_options){
                if(att){
                    att += ";" + node.__knot_cbs_options;
                }
                else{
                    att=node.__knot_cbs_options;
                }
            }

            if (att) {
                var bindingOptions = this.parseOptionToJSON(att);
                if (bindingOptions.style) {
                    var v = bindingOptions.style;
                    delete bindingOptions.style;
                    for (var s in v) {
                        bindingOptions["style-" + s] = v[s];
                    }
                }
                options.isTemplate = false;
                if(typeof(bindingOptions.isTemplate) != "undified"){
                    options.isTemplate = bindingOptions.isTemplate;
                    delete  bindingOptions.isTemplate;
                }

                var valueConverters = {}, twoWayBinding = {}, validators = {}, bindingToError = {}, actions={};
                for (var p in bindingOptions) {
                    if(p[0] == "@"){
                        actions[p.substr(1)] = bindingOptions[p];
                        delete bindingOptions[p];
                    }
                    else if(p== "dataContext"){
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
                        bindingOptions[p] = this.parseDetailedOptions(p, v, valueConverters, validators);
                    }
                }
                if(!Utility.isEmptyObj(valueConverters))
                    options.valueConverters = valueConverters;
                if(!Utility.isEmptyObj(twoWayBinding))
                    options.twoWayBinding = twoWayBinding;
                if (!Utility.isEmptyObj(bindingToError))
                    options.bindingToError = bindingToError;
                if (!Utility.isEmptyObj(validators))
                    options.validators = validators;
                if(!Utility.isEmptyObj(actions)){
                    options.actions = actions;
                }
                if(!Utility.isEmptyObj(bindingOptions))
                    options.binding = bindingOptions;

            }
            node.__knot_parsedOptions = options;
            return options;
        }
    }

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
            template = Utility.getObjectInGlobalScope(id);
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
                knotInfo.childrenInfo.push(internalTie(n, items[i], contextPath+".["+i+"]"));
                addChildTo(node, n, i);
                if (knotInfo.options.actions && knotInfo.options.actions.itemCreated) {
                    var callback = Utility.getObjectInGlobalScope(knotInfo.options.actions.itemCreated);
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
        var d = Utility.getValueOnPath(knotInfo.dataContext, knotInfo.options.binding.content);
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
            var d = Utility.getValueOnPath(knotInfo.dataContext, knotInfo.options.binding[valueName])
            syncItems(knotInfo, d)
        }
        else if(valueName == "content"){
            syncContent(knotInfo)
        }
        else{
            var knotType = Extension.findProperKnotType(knotInfo.node.tagName, valueName);
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
                var actionType = Extension.findProperActionType(knotInfo.node.tagName, action);
                if(!actionType){
                    throw new Error("Failed to find the proper action type!  tag:" +knotInfo.node.tagName + " type:" + action);
                }
                var actionHandle =  Utility.getObjectInGlobalScope(knotInfo.options.actions[action]);
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
        var dataToBinding = Utility.getValueOnPath(knotInfo.dataContext, objectPath);
        if (dataToBinding) {
            if (!Validating.hasRegisteredOnError(dataToBinding)) {
                (function () {
                    Validating.registerOnError(dataToBinding, knotInfo, function (property) {
                        for (var v in knotInfo.options.bindingToError) {
                            if (knotInfo.options.binding[v].substr(0, objectPath.length) == objectPath) {
                                var pos = objectPath.length>0?objectPath.length+1:0;
                                if (property == knotInfo.options.binding[v].substr(pos))
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

    function monitorData(curData, curPath, knotInfo){
        DataMonitor.register(curData, knotInfo, function (propertyName) {
            var fullPath = propertyName;
            if (curPath != ""){
                if(propertyName)
                    fullPath = curPath + "." + propertyName;
                else
                    fullPath = curPath;
            }

            for (var p in knotInfo.options.twoWayBinding) {
                var path = knotInfo.options.binding[p];
                if(path[0] == "$" || path=="--self"){
                    updateDisplay(knotInfo, p);
                    continue;
                }
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
    }

    function setupDataNotification(knotInfo) {
        for (var valueName in knotInfo.options.twoWayBinding) {
            if(knotInfo.options.binding[valueName][0] == "$"){
                monitorData(knotInfo.dataContext, "", knotInfo);
            }

            if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
                if(setupErrorNotification(knotInfo, valueName))
                    continue;
            }

            var pathSections = knotInfo.options.binding[valueName].split(".");
            var path = "";
            for (var i = 0; i < pathSections.length + 1; i++) {
                var curData = knotInfo.dataContext;
                if (path != ""){
                    curData =Utility.getValueOnPath(knotInfo.dataContext, path)
                }
                if (!curData)
                    break;

                if(typeof(curData) != "object" && typeof(curData) != "array")
                    break;

                if (!DataMonitor.hasRegistered(curData, knotInfo)) {
                    monitorData(curData, path, knotInfo);
                }

                if(path != "")
                    path += ".";
                path += pathSections[i];
            }

            if(valueName != "foreach" && valueName != "content"){
                var knotType = Extension.findProperKnotType(knotInfo.node.tagName, valueName);
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


            var validator = Utility.getObjectInGlobalScope(knotInfo.options.validators[valueName][i]);
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

            Validating.setError(data, path, errMessage);
            if (errMessage) {
                for (var i = 0; i < Validating.onValidatingErrorCallbacks.length; i++) {
                    Validating.onValidatingErrorCallbacks[i](errMessage, knotInfo.node);
                }
                return errMessage;
            }
        }
        return null;
    }


    function getDataValue(knotInfo, valueName) {
        var path =knotInfo.options.binding[valueName];

        if(path[0] == "$"){
            var func = Utility.getObjectInGlobalScope(path.substr(1));
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
        if (path == "--self")
            return knotInfo.dataContext;


        var value;
        if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
            var arr = path.split(".");
            var propertyName = arr[arr.length - 1];
            var objectPath = path.substr(0, path.length - propertyName.length-1);
            var dataToBinding = Utility.getValueOnPath(root, objectPath);
            value = Validating.getError(dataToBinding, propertyName);
        }
        else{
            value = Utility.getValueOnPath(root, path);
        }

        if (valueName != "foreach" && valueName != "content" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = Utility.getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
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

        if (valueName != "foreach" && valueName != "content" && knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]) {
            var converter = Utility.getObjectInGlobalScope(knotInfo.options.valueConverters[valueName]);
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
            DataMonitor.notifyDataChanged(data, path);
    }


    var _isInitialized = false;

    function tie(onFinished, onError){
        if(!_isInitialized){
            if(!onError)
                onError = function(e){alert(e);};
            CBS.cbsInit(function(){
                _isInitialized = true;
                try{
                    internalTie();
                }
                catch(err){
                    if(onError) onError(err.message);
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

        info.options = OptionParser.parse(docNode);
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
            dataContext = Utility.getValueOnPath(root, path);
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
            var knotType = Extension.findProperKnotType(knotInfo.node.tagName, valueName);
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
            var actionType = Extension.findProperActionType(knotInfo.node.tagName, action);
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

                DataMonitor.unregister(curData, knotInfo);

                if(pathSections.length > i){
                    if (path != "")
                        path += ".";
                    path += pathSections[i];
                }
            }

            if (knotInfo.nodeMonitoringInfo && knotInfo.nodeMonitoringInfo[valueName]) {
                var knotType = Extension.findProperKnotType(knotInfo.node.tagName, valueName);
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
                if (!Utility.getValueOnPath(info.dataContext, objectPath))
                    continue;
                var knotType = Extension.findProperKnotType(info.node.tagName, v);
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
        registerKnotExtension: function(ext, type){
            Extension.register(ext, type);
        },

        registerOnValidatingError: function(errorCallback){
            Validating.onValidatingErrorCallbacks.push(errorCallback);
        },
        unregisterOnValidatingError: function (errorCallback) {
            Validating.onValidatingErrorCallbacks.splice(Validating.onValidatingErrorCallbacks.indexOf(errorCallback), 1);
        },

        notifyDataChanged:function(data, propertyName)
        {
            DataMonitor.notifyDataChanged(data, propertyName);
        },
        setValue: function (data, property, value) {
            data[property] = value;
            DataMonitor.notifyDataChanged(data, property);
        },
        addToArray: function (array, data) {
            array.push(data);
            DataMonitor.notifyDataChanged(array);
            DataMonitor.notifyDataChanged(array, "length");
        },
        removeFromArray: function (array, data) {
            array.splice(array.indexOf(data), 1);
            DataMonitor.notifyDataChanged(array);
            DataMonitor.notifyDataChanged(array, "length");
        },

        __registerKnotDebugger: function(dbg){
            knotDebugger = dbg;
        }
    }
})();