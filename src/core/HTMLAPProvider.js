/*
    This is the Access Point Provider for general HTML elements
    It provides the ability of accessing the standard HTML element fields, method and events
    It supports monitoring some of the change of html properties (defined in htmlEventInfo)
* */
(function (global) {
    "use strict";

    var __private = global.Knot.getPrivateScope();

    //the change event information for the properties of HTML elements
    //only the properties that defined here supporting monitoring
    var htmlEventInfo = [];
    htmlEventInfo["input.value"] = "change";
    htmlEventInfo["textarea.value"] = "change";
    htmlEventInfo["input.checked"] = "change";
    htmlEventInfo["select.selectedIndex"] = "change";
    htmlEventInfo["select.value"] = "change";
    htmlEventInfo["*.clientWith"] = "resize";
    htmlEventInfo["*.clientHeight"] = "resize";
    htmlEventInfo["*.scrollTop"] = "scroll";
    htmlEventInfo["*.scrollLeft"] = "scroll";

    function getEvent(target, apName){
        var eventKey = target.tagName.toLowerCase() + "." +apName;
        return (htmlEventInfo[eventKey] || htmlEventInfo["*." + apName]);
    }

    //provide some helper functions for the HTML elements
    __private.HTMLAPHelper = {
        getNodeDescription: function (element) {
            var description = element.tagName;
            if(element.id) {
                description += "[#" + element.id+"]";
            }
            else if(element.className) {
                description += "[" + element.className.split(" ")
                    .filter(function (t) {return t.trim() !=="";})
                    .map(function (t) {return "."+t;})
                    .join(" ")+ "]";
            }
            return description;
        },

        getSelectorFromAPDescription: function (apName) {
            var arr = __private.Utility.splitWithBlockCheck(apName, ".");
            return __private.Utility.trim(arr[0]);
        },
        getPropertyNameFromAPDescription: function (apName) {
            var arr = __private.Utility.splitWithBlockCheck(apName, ".");
            if(arr.length > 1) {
                return arr.slice(1).join(".");
            }
            return undefined;
        },

        getPropertyFromElement: function (element, property) {
            if(!element) {
                return undefined;
            }
            return __private.Utility.getValueOnPath(element, property);
        },

        queryElement: function (cssSelector) {
            if(cssSelector.indexOf("(")>0) {
                var info = __private.Utility.getBlockInfo(cssSelector, 0, "(", ")");
                if(!info) {
                    __private.Log.error("Unknown selector:" +  cssSelector);
                    return undefined;
                }
                try{
                    var actualCSS = cssSelector.substr(info.start+1, info.end-info.start-1);
                    return document.querySelector(actualCSS);
                }
                catch(err) {
                    __private.Log.error("Query selector failed.", err);
                    return undefined;
                }

            }
            else{
                return document.querySelector(cssSelector);
            }
        }
    };

    ///////////////////////////////////////
    // template relevant
    ///////////////////////////////////////

    function removeNodeCreatedFromTemplate(node) {
        __private.HTMLKnotBuilder.clearBinding(node);
        node.parentNode.removeChild(node);
        __private.Debugger.nodeRemoved(node);
    }

    function findChildByDataContext(node, item, startIndex) {
        for (var i = startIndex; i < node.children.length; i++) {
            if (node.children[i].__knot && node.children[i].__knot.dataContext === item) {
                return node.children[i];
            }
        }
        return null;
    }

    function addChildTo(node, child, index) {
        if (node.children.length === index) {
            node.appendChild(child);
        }
        else {
            node.insertBefore(child, node.children[index]);
        }
    }

    function getTemplateFromSelector(selector, node, value, allowNullResult){
        try{
            var selectorFunc = __private.Utility.getValueOnPath(value, selector);
            if(!selectorFunc){
                __private.Log.error("Can't find template selector:" + selector);
                return null;
            }
            var template =  selectorFunc.apply(node, [value, node]);
            if(!template && !allowNullResult){
                __private.Log.error("The template selector returns NULL. template selector:" + selector);
            }
            return template;
        }
        catch(err){
            __private.Log.error("Call template selector failed. template selector:" + selector, err);
            return null;
        }
    }

    //set "content" Access Point for the target
    //it create a new element from template and set the item as the only child of the target element
    function setContent(target, value, options) {
        if(!options || (!options.template && !options.templateSelector)) {
            __private.Log.error("No valid template is specified for 'content' access point. current node:" + __private.HTMLAPHelper.getNodeDescription(target));
            return;
        }

        var raiseEvent = function(childNode, evt){
            if(options && options[evt]){
                var f = __private.Utility.getValueOnPath(target, options[evt]);
                try{
                    f.apply(target, [childNode, __private.HTMLKnotBuilder.getOnNodeDataContext(value)]);
                }
                catch(err) {
                    __private.Log.warning("Raise " + evt + " event failed.", err);
                }
            }
        };

        var template = options.template;
        var isTemplateSelector = false;
        if(options.templateSelector){
            if(!(value === null || typeof(value) === "undefined")){
                template = getTemplateFromSelector(options.templateSelector, target, value, true);
            }
            isTemplateSelector = true;
        }

        var currentContent =  target.children[0]
        if(!currentContent) {
            if(value === null || typeof(value) === "undefined" || template === null || typeof (template) === "undefined") {
                return;
            }
            var n  = __private.HTMLKnotBuilder.createFromTemplate(template, value, target);
            if(n) {
                raiseEvent(currentContent, "@adding");
                target.appendChild(n);
                if(!__private.HTMLKnotBuilder.hasDataContext(n)) {
                    __private.HTMLKnotBuilder.setDataContext(n, value);
                }
                raiseEvent(n, "@added");
                __private.Debugger.nodeAdded(n);
            }
        }
        else{
            if(currentContent.__knot && currentContent.__knot.dataContext === value) {
                return;
            }
            if(value === null || typeof(value) === "undefined" || template === null || typeof (template) === "undefined") {
                raiseEvent(currentContent, "@removing");
                removeNodeCreatedFromTemplate(currentContent);
                raiseEvent(currentContent, "@removed");
            }
            else{
                if(isTemplateSelector || __private.HTMLKnotBuilder.isDynamicTemplate(template)) {
                    removeNodeCreatedFromTemplate(currentContent);
                    currentContent = null;
                    if(template){
                        currentContent  = __private.HTMLKnotBuilder.createFromTemplate(template, value, target);
                    }
                    if(currentContent) {
                        raiseEvent(currentContent, "@adding");
                        target.appendChild(currentContent);
                        if(!__private.HTMLKnotBuilder.hasDataContext(currentContent)) {
                            __private.HTMLKnotBuilder.setDataContext(currentContent, value);
                        }
                        __private.Debugger.nodeAdded(currentContent);
                        raiseEvent(currentContent, "@added");
                    }
                }
                else{
                    __private.HTMLKnotBuilder.setDataContext(currentContent, value);
                }
                if(currentContent) {
                    if(!currentContent.__knot) {
                        currentContent.__knot = {};
                    }
                    currentContent.__knot.dataContext = value;
                }
            }
        }
    }

    //it create the the elements from template and add them to node's children collection
    //and synchronize the elements in node's children and array
    function syncItems(node, values, template, templateSelector, options, additionalInfo) {
        var i, n;
        //take null values as empty array.
        if (!values) {
            values = [];
        }

        var raiseEvent = function(childNode, value, evt){
            if(options && options[evt]){
                var f = __private.Utility.getValueOnPath(node, options[evt]);
                try{
                    f.apply(node, [childNode, value]);
                }
                catch(err) {
                    __private.Log.warning("Raise " + evt + " event failed.", err);
                }
            }
        };

        if(additionalInfo){
            if(node.__knot_latestForeachArrayVersion === values.__knot_arrayVersion)
                return;
            if(additionalInfo.removed){
                var removed = additionalInfo.removed;
                for(i=removed.length-1; i >= 0; i--){
                    n = node.children[removed[i]];
                    raiseEvent(n, __private.HTMLKnotBuilder.getOnNodeDataContext(n), "@removing");
                    removeNodeCreatedFromTemplate(n);
                    raiseEvent(n, null, "@removed");
                }
            }
            if(additionalInfo.added){
                var added = additionalInfo.added;
                for(i=0; i<added.length; i++){
                    if(templateSelector){
                        template = getTemplateFromSelector(templateSelector, node, values[added[i]]);
                        if(!template){
                            continue;
                        }
                    }
                    n = __private.HTMLKnotBuilder.createFromTemplate(template, values[added[i]], node);
                    if (n) {
                        raiseEvent(n, values[added[i]], "@adding");
                        addChildTo(node, n, added[i]);
                        if(!__private.HTMLKnotBuilder.hasDataContext(n)) {
                            __private.HTMLKnotBuilder.setDataContext(n, values[added[i]]);
                        }
                         __private.Debugger.nodeAdded(n);
                        raiseEvent(n, values[added[i]], "@added");
                    }
                }
            }
            node.__knot_latestForeachArrayVersion = values.__knot_arrayVersion;
        }
        else{
            for (i = 0; i < values.length; i++) {
                var ele = findChildByDataContext(node, values[i], i);
                if (ele) {
                    if (Array.prototype.indexOf.call(node.children, ele) !== i) {
                        node.removeChild(ele);
                        addChildTo(node, ele, i);
                    }
                }
                else {
                    if(templateSelector){
                        template = getTemplateFromSelector(templateSelector, node, values[i]);
                        if(!template){
                            continue;
                        }
                    }
                    n = __private.HTMLKnotBuilder.createFromTemplate(template, values[i], node);
                    if (n) {
                        raiseEvent(n, values[i], "@adding");
                        addChildTo(node, n, i);
                        if(!__private.HTMLKnotBuilder.hasDataContext(n)) {
                            __private.HTMLKnotBuilder.setDataContext(n, values[i]);
                        }
                        __private.Debugger.nodeAdded(n);
                        raiseEvent(n, values[i], "@added");
                    }
                }
            }

            for (i = node.children.length - 1; i >= values.length; i--) {
                n = node.children[i];
                raiseEvent(n, __private.HTMLKnotBuilder.getOnNodeDataContext(n), "@removing");
                removeNodeCreatedFromTemplate(n);
                raiseEvent(n, null, "@removed");
            }
        }
    }


//      this is a failed attempt to improve the performance of foreach binding. It tries to reuse the
//      HTMLElement to improve performance. The result is slower.I think might because of too much "indexOf"?
//
//    function syncItemsx(node, values, template, onItemCreated, onItemRemoved) {
//        //take null values as empty array.
//        if (!values) {
//            values = [];
//        }
//        var removedChildren = Array.prototype.slice.apply(node.children, [0]);
//        var newChildren = [];
//        var i;
//
//        for(i=0; i<values.length; i++){
//            newChildren[i] = findChildByDataContext(node, values[i], i);
//            if (newChildren[i]) {
//                removedChildren.splice(removedChildren.indexOf(newChildren[i]), 1);
//            }
//        }
//        for(i=0; i<removedChildren.length; i++){
//            removeNodeCreatedFromTemplate(removedChildren[i]);
//            if(onItemRemoved) {
//                onItemRemoved.apply(node, [removedChildren[i]]);
//            }
//        }
//
//        for(i=0; i<values.length; i++){
//            if(newChildren[i]){
//                if(Array.prototype.indexOf.call(node.children, newChildren[i]) !== i){
//                    node.removeChild(newChildren[i]);
//                    addChildTo(node, newChildren[i], i);
//                }
//            }
//            else{
//                var newNode;
//                if(removedChildren.length > 0 && !__private.HTMLKnotBuilder.isDynamicTemplate(template)){
//                    newNode = removedChildren.pop();
//                }
//                else{
//                    newNode = __private.HTMLKnotBuilder.createFromTemplate(template, values[i], node);
//                }
//                if(newNode){
//                    addChildTo(node, newNode, i);
//                    if(!__private.HTMLKnotBuilder.hasDataContext(newNode)) {
//                        __private.HTMLKnotBuilder.setDataContext(newNode, values[i]);
//                    }
//                    __private.Debugger.nodeAdded(newNode);
//                    if(onItemCreated) {
//                        onItemCreated.apply(node, [newNode, values[i]]);
//                    }
//                }
//            }
//        }
//    }

    //set "foreach" Access Point for the html node
    function setForeach(node, values, options, additionalInfo) {
        if(!options || (!options.template && !options.templateSelector)){
            __private.Log.error("No valid template is specified for 'foreach' access point. current node:" + __private.HTMLAPHelper.getNodeDescription(node));
            return;
        }
        syncItems(node, values, options.template, options.templateSelector, options, additionalInfo);
    }


    //HTML Access Point Provider
    __private.HTMLAPProvider={
        doesSupport: function (target, apName) {
            //if start from "#", then it's an css selector
            if(apName[0] === "#") {
                return true;
            }

            if(apName[0] === "!") {
                return false;
            }

            //check whether target is html element
            return (target instanceof HTMLElement);
        },

        getValue: function (target, apName, options) {
            if(apName[0] === "@") {
                return;
            }

            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(__private.Utility.startsWith(apName, "content") || __private.Utility.startsWith(apName, "foreach")) {
                return;
            }
            return __private.HTMLAPHelper.getPropertyFromElement(target, apName);
        },

        setValue: function (target, apName, value, options, additionalInfo) {
            if(apName[0] === "@") {
                if(typeof(value) !== "function") {
                    __private.Log.error( "Event listener must be a function!");
                    return;
                }

                if(target) {
                    //make sure the event is not registered more than once
                    var evtName = apName.substr(1);
                    if (!target.__knot_eventInfo)
                        target.__knot_eventInfo = {};
                    if(!target.__knot_eventInfo[evtName])
                        target.__knot_eventInfo[evtName] = [];
                    if (target.__knot_eventInfo[evtName].indexOf(value) < 0) {
                        target.addEventListener(evtName, function (e) {
                            var dataContext = target.__knot.dataContext;
                            value.apply(dataContext, [e, target]);
                        });
                        target.__knot_eventInfo[evtName].push(value);
                    }
                }
                return;
            }

            if(apName[0] === "#") {
                target  = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(__private.Utility.startsWith(apName, "content")) {
                setContent(target, value, options);
            }
            else if(__private.Utility.startsWith(apName, "foreach")) {
                setForeach(target, value, options, additionalInfo);
            }
            else{
                if(typeof(value) === "undefined") {
                    value = "";
                }
                __private.Utility.setValueOnPath(target, apName, value);
            }
        },

        doesSupportMonitoring: function (target, apName) {
            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }
            if(!target) {
                return false;
            }
            var eventKey = target.tagName.toLowerCase() + "." +apName;
            return (htmlEventInfo[eventKey] || htmlEventInfo["*." + apName]);
        },

        monitor: function (target, apName, callback, options) {
            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            var eventKey = target.tagName.toLowerCase() + "." +apName;
            var events = htmlEventInfo[eventKey].split(",");
            for(var i=0; i<events.length; i++) {
                target.addEventListener(events[i], callback);
            }

            if((target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "textarea") &&
                (options && options.immediately &&
                    (options.immediately === "1" || options.immediately.toLowerCase()==="true"))) {
                target.addEventListener("keyup", callback);
            }
        },

        stopMonitoring: function (target, apName, callback, options) {
            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }
            var eventKey = target.tagName.toLowerCase() + "." +apName;
            var events = htmlEventInfo[eventKey].split(",");
            for(var i=0; i<events.length; i++) {
                target.removeEventListener(events[i], callback);
            }

            //for the text input and text area, there's an option "immediately". when "immediately" is on,
            //report the change for each of the key stroke.
            if((target.tagName.toLowerCase() === "input" || target.tagName.toLowerCase() === "textarea") &&
                (options && options.immediately &&
                    (options.immediately === "1" || options.immediately.toLowerCase() === "true"))) {
                target.removeEventListener("keyup", callback);
            }
        },

        //expose to interface
        syncItems:syncItems
    };
    //register the provider to system to make it alive
    __private.KnotManager.registerAPProvider(__private.HTMLAPProvider);


    //this is the provider for error status of HTML Access Point.
    //when system requires monitoring the error status of a HTML Access Point, it stores the relevant information
    //to "__knot_errorStatusInfo" property on the HTML element.
    // When the error status is changed, it calls the callbacks to notify system the error status is changed
    __private.HTMLErrorAPProvider = {
        doesSupport: function (target, apName) {
            if(apName) {
                if(apName[0] === "!") {
                    apName = apName.substr(1);
                }
                //if starts with "#", then it's a css selector
                if(apName[0] === "#") {
                    return true;
                }
            }
            return (target instanceof HTMLElement);
        },
        getValue: function (target, apName, options) {
            //only support getting error status
            if(apName[0] !== "!") {
                return undefined;
            }
            apName = apName.substr(1);
            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement((__private.HTMLAPHelper.getSelectorFromAPDescription(apName)));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }
            if(!target) {
                return undefined;
            }
            else{
                if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName]) {
                    return null;
                }

                return target.__knot_errorStatusInfo[apName].currentStatus;
            }
        },
        setValue: function (target, apName, value, options) {
            //only support setting error status
            if(apName[0] !== "!") {
                return;
            }
            apName = apName.substr(1);
            if(apName[0] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }
            if(target) {
                if(!value && (!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName])) {
                    return;
                }
                if(!target.__knot_errorStatusInfo) {
                    target.__knot_errorStatusInfo = {};
                }
                if(!target.__knot_errorStatusInfo[apName]) {
                    target.__knot_errorStatusInfo[apName] = {};
                }
                if(target.__knot_errorStatusInfo[apName].currentStatus === value) {
                    return;
                }

                target.__knot_errorStatusInfo[apName].currentStatus = value;
                if(target.__knot_errorStatusInfo[apName].changedCallbacks) {
                    var callbacks = target.__knot_errorStatusInfo[apName].changedCallbacks;
                    for(var i=0; i<callbacks.length; i++) {
                        try{
                            callbacks[i].apply(target, [apName, value]);
                        }
                        catch (error) {
                            __private.Log.warning( "Call error status changed callback failed.", error);
                        }
                    }
                }

                if(options && options["@error"]){
                    var f = __private.Utility.getValueOnPath(null, options["@error"]);
                    if(!f || typeof(f) !== "function") {
                        __private.Log.error("'"+options["@error"]+"' must be a function.");
                    }
                    else{
                        try{
                            f.apply(target, [apName, value]);
                        }
                        catch (err) {
                            __private.Log.error("Call AP error event handler '"+options["@error"]+"' failed.", err);
                        }
                    }
                }
            }
        },
        doesSupportMonitoring: function (target, apName) {
            return (apName[0] === "!");
        },
        monitor: function (target, apName, callback, options) {
            if(apName[0] === "!") {
                apName = apName.substr(1);
                if(apName[0] === "#") {
                    var selector = __private.HTMLAPHelper.getSelectorFromAPDescription(apName);
                    target = __private.HTMLAPHelper.queryElement(selector);
                    if(!target) {
                        __private.Log.warning("Failed to bind to error status, target is not found.  target selector:" + selector);
                        return;
                    }
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
                }
                if(!target.__knot_errorStatusInfo) {
                    target.__knot_errorStatusInfo = {};
                }
                if(!target.__knot_errorStatusInfo[apName]) {
                    target.__knot_errorStatusInfo[apName] = {};
                }
                if(!target.__knot_errorStatusInfo[apName].changedCallbacks) {
                    target.__knot_errorStatusInfo[apName].changedCallbacks = [];
                }
                target.__knot_errorStatusInfo[apName].changedCallbacks.push(callback);
            }
        },
        stopMonitoring: function (target, apName, callback, options) {
            if(apName[1] === "#") {
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPDescription(apName.substr(1)));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName.substr(1));
            }
            if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName] || !target.__knot_errorStatusInfo[apName].changedCallbacks) {
                return;
            }
            var index = target.__knot_errorStatusInfo[apName].changedCallbacks.indexOf(callback);
            if(index >= 0) {
                target.__knot_errorStatusInfo[apName].changedCallbacks.splice(index, 1);
            }
        },

        //get the error status information from the node and it's offspring
        //returns all of the error status found
        getErrorStatusInformation: function (node, result) {
            if(node.__knot_errorStatusInfo) {
                for(var apName in node.__knot_errorStatusInfo) {
                    if (node.__knot_errorStatusInfo[apName] && node.__knot_errorStatusInfo[apName].currentStatus) {
                        result.push({node: node, accessPointName: apName, error: node.__knot_errorStatusInfo[apName].currentStatus});
                    }
                }
            }
            for(var i=0; i<node.children.length; i++) {
                this.getErrorStatusInformation(node.children[i], result);
            }
        }
    };

    //register to error status provider make alive
    __private.KnotManager.registerAPProvider(__private.HTMLErrorAPProvider, true);
})(window);
