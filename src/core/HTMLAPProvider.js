(function(window){
    var __private = window.Knot.getPrivateScope();

    var htmlEventInfo = [];
    htmlEventInfo["input.value"] = "change";
    htmlEventInfo["textarea.value"] = "change";
    htmlEventInfo["input.checked"] = "change";
    htmlEventInfo["select.selectedindex"] = "change";
    htmlEventInfo["select.value"] = "change";

    __private.HTMLAPHelper = {
        getNodeDescription: function (element){
            var description = element.tagName;
            if(element.id){
                description += "[#" + element.id+"]";
            }
            else if(element.className){
                description += "[" + element.className.split(" ")
                    .filter(function(t){return t.trim()!="";})
                    .map(function(t){return "."+t;})
                    .join(" ")+ "]";
            }
            return description;
        },

    getSelectorFromAPName:function(apName){
            var arr = __private.Utility.splitWithBlockCheck(apName, ".");
            return __private.Utility.trim(arr[0]);
        },
        getPropertyNameFromAPName:function (apName){
            var arr = __private.Utility.splitWithBlockCheck(apName, ".");
            if(arr.length > 1)
                return arr.slice(1).join(".");
        },

        getPropertyFromElemnt: function (element, property){
            if(!element)
                return undefined;
            return __private.Utility.getValueOnPath(element, property);
        },

        parseInAPNameDefinition: function (apName){
            var result = {apName:apName, options:{}};
            var block = __private.Utility.getBlockInfo(apName, 0, "[", "]");
            if(!block){
                result.apName = apName;
            }
            else{
                result.apName = __private.Utility.trim(apName.substr(0, block.start));
                var options = apName.substr(block.start+1, block.end-block.start-1);
                options = options.split(";");
                for(var i=0; i<options.length;i++){
                    var opPair = options[i].split(":");
                    if(opPair.length!=2){
                        __private.Log.error( "Invalid options:"+options[i]);
                        continue;
                    }
                    result.options[__private.Utility.trim(opPair[0])] = __private.Utility.trim(opPair[1]);
                }
            }
            return result;
        },

        queryElement: function(cssSelector){
            if(cssSelector.indexOf("(")>0){
                var info = __private.Utility.getBlockInfo(cssSelector, 0, "(", ")");
                if(!info){
                    __private.Log.error("Unknown selector:" +  cssSelector);
                    return undefined;
                }
                try{
                    var actualCSS = cssSelector.substr(info.start+1, info.end-info.start-1);
                    return document.querySelector(actualCSS);
                }
                catch(err){
                    __private.Log.error("Query selector failed.", err);
                    return undefined;
                }

            }
            else{
                return document.querySelector(cssSelector);
            }
        }
    }

    function removeNodeCreatedFromTemplate(node){
        __private.HTMLKnotManager.clearBinding(node);
        node.parentNode.removeChild(node);
        __private.Debugger.nodeRemoved(node);
    }
    function setContent(target, value, options){
        if(!options || !options["template"]){
            __private.Log.error("No valid template is specified for 'content' access point. current node:" + __private.HTMLAPHelper.getNodeDescription(target));
            return;
        }
        var currentContent =  target.childNodes[0];
        if(!currentContent){
            if(value === null || typeof(value) === "undefined")
                return;
            var n  = __private.HTMLKnotManager.createFromTemplateAndUpdateData(options["template"], value);
            if(n){
                target.appendChild(n, value);
                __private.Debugger.nodeAdded(n);
            }
        }
        else{
            if(currentContent.__knot && currentContent.__knot.dataContext == value){
                return;
            }
            if(value === null || typeof(value) === "undefined")
                removeNodeCreatedFromTemplate(currentContent);
            else{
                if( __private.HTMLKnotManager.isDynamicTemplate(options["template"])){
                    removeNodeCreatedFromTemplate(currentContent);
                    currentContent  = __private.HTMLKnotManager.createFromTemplateAndUpdateData(options["template"], value);
                    if(currentContent){
                        target.appendChild(currentContent, value);
                        __private.Debugger.nodeAdded(n);
                    }
                }
                else{
                    __private.HTMLKnotManager.updateDataContext(currentContent, value);
                }
                if(currentContent.__knot)
                    currentContent.__knot={};
                currentContent.__knot.dataContext = value;
            }
        }
    }

    function findChild(node, item, startIndex) {
        for (var i = startIndex; i < node.children.length; i++) {
            if (node.children[i].__knot && node.children[i].__knot.dataContext == item) {
                return node.children[i];
            }
        }
        return null;
    }
    function addChildTo(node, child, index) {
        if (node.children.length == index)
            node.appendChild(child);
        else
            node.insertBefore(child, node.children[index]);
    }


    function syncItems(node, values, template, onItemCreated, onItemRemoved) {
        //take null values as empty array.
        if (!values) {
            values = [];
        }
        for (var i = 0; i < values.length; i++) {
            var ele = findChild(node, values[i], i);
            if (ele) {
                if (Array.prototype.indexOf.call(node.children, ele) != i) {
                    node.removeChild(ele);
                    addChildTo(node, ele, i);
                }
            }
            else {
                var n = __private.HTMLKnotManager.createFromTemplateAndUpdateData(template, values[i]);
                if (n) {
                    addChildTo(node, n, i);
                    __private.Debugger.nodeAdded(n);
                    if(onItemCreated)
                        onItemCreated.apply(node, [n]);
                }
            }
        }

        for (var i = node.children.length - 1; i >= values.length; i--) {
            removeNodeCreatedFromTemplate(node.children[i])
            if(onItemRemoved)
                onItemRemoved.apply(node, [n]);
        }
    }

    function setForeach(node, values, options){
        if(!options || !options["template"]){
            __private.Log.error("No valid template is specified for 'foreach' access point. current node:" + __private.HTMLAPHelper.getNodeDescription(node));
            return;
        }
        syncItems(node, values, options["template"], __private.Utility.getValueOnPath(node, options["@added"]), __private.Utility.getValueOnPath(node, options["@removed"]));
    }

    __private.HTMLAPProvider={
        //this provider support error status handling.
        doesSupportErrorStatus:true,
        doesSupport:function(target, apName){
            //if start from "#", then it's an id selector, we only support id selector
            if(apName[0] == "#"){
                return true;
            }

            //!is error status binding with must comes with an id selector
            if(apName[0] == "!"){
                return true;
            }

            //check whether target is html element
            if(target instanceof HTMLElement){
                return true;
            }
            return false;
        },
        getValue: function(target, apName, options){
            if(apName[0] == "@"){
                return;
            }

            if(apName[0] == "!"){
                apName = apName.substr(1);
                if(apName[0] == "#"){
                    target = __private.HTMLAPHelper.queryElement((__private.HTMLAPHelper.getSelectorFromAPName(apName)));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }
                if(!target)
                    return undefined;
                else{
                    if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName])
                        return null;

                    return target.__knot_errorStatusInfo[apName].currentStatus;
                }
            }

            if(apName[0] == "#"){
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(__private.Utility.startsWith(apName, "content") || __private.Utility.startsWith(apName, "foreach"))
                return;
            return __private.HTMLAPHelper.getPropertyFromElemnt(target, apName);
        },
        setValue: function(target, apName, value, options){
            if(apName[0] == "@"){
                if(typeof(value) != "function"){
                    __private.Log.error( "Event listener must be a function!");
                }

                if(target){
                    target.addEventListener(apName.substr(1), function(e){
                        var dataContext = target.__knot.dataContext
                        value.apply(dataContext, [e, target]);
                    });;
                }
                return;
            }

            if(apName[0] == "!"){
                apName = apName.substr(1);
                if(apName[0] == "#"){
                    target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }
                if(target){
                    if(!value && (!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName] || !target.__knot_errorStatusInfo[apName].changedCallbacks))
                        return;
                    if(!target.__knot_errorStatusInfo)
                        target.__knot_errorStatusInfo = {};
                    if(!target.__knot_errorStatusInfo[apName])
                        target.__knot_errorStatusInfo[apName] = {};
                    target.__knot_errorStatusInfo[apName].currentStatus = value;
                    if(target.__knot_errorStatusInfo[apName].changedCallbacks){
                        var callbacks = target.__knot_errorStatusInfo[apName].changedCallbacks;
                        for(var i=0; i<callbacks.length; i++){
                            try{
                                callbacks[i].apply(target, [apName, value]);
                            }
                            catch (error){
                                __private.Log.warning( "Call error status changed callback failed.", error);
                            }
                        }
                    }
                }
                return;
            }

            if(apName[0] == "#"){
                target  = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(__private.Utility.startsWith(apName, "content")){
                setContent(target, value, options);
            }
            else if(__private.Utility.startsWith(apName, "foreach")){
                setForeach(target, value, options);
            }
            else{
                if(typeof(value) == "undefined")
                    value ="";
                __private.Utility.setValueOnPath(target, apName, value);
            }
        },
        doesSupportMonitoring: function(target, apName){
            if(apName[0] == "!"){
                return true;
            }
            if(apName[0] == "#"){
                target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }
            if(!target)
                return false;
            var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
            if(htmlEventInfo[eventKey])
                return true;
            else
                return false;
        },
        monitor: function(target, apName, callback, options){
            if(apName[0] == "!"){
                apName = apName.substr(1);
                if(apName[0] == "#"){
                    target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }
                if(!target.__knot_errorStatusInfo)
                    target.__knot_errorStatusInfo = {};
                if(!target.__knot_errorStatusInfo[apName])
                    target.__knot_errorStatusInfo[apName] = {};
                if(!target.__knot_errorStatusInfo[apName].changedCallbacks)
                    target.__knot_errorStatusInfo[apName].changedCallbacks=[];
                target.__knot_errorStatusInfo[apName].changedCallbacks.push(callback);
            }
            else{
                if(apName[0] == "#"){
                    target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }

                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var events = htmlEventInfo[eventKey].split(",");
                for(var i=0; i<events.length; i++)
                    target.addEventListener(events[i], callback);

                if((target.tagName.toLowerCase() == "input" || target.tagName.toLowerCase() == "textarea") &&
                    (options &&
                        (options["immediately"]==1 || options["immediately"].toLowerCase()=="true"))){
                    target.addEventListener("keyup", callback);
                }
            }
        },
        stopMonitoring: function(target, apName, callback, options){
            if(apName[0] == "!"){
                if(apName[1] == "#"){
                    target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName.substr(1)));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName.substr(1));
                }
                if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName] || !target.__knot_errorStatusInfo[apName].changedCallbacks)
                    return;
                var index = target.__knot_errorStatusInfo[apName].changedCallbacks.indexOf(callback);
                if(index >= 0)
                    target.__knot_errorStatusInfo[apName].changedCallbacks.splice(index, 1);
            }
            else{
                if(apName[0] == "#"){
                    target = __private.HTMLAPHelper.queryElement(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }
                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var events = htmlEventInfo[eventKey].split(",");
                for(var i=0; i<events.length; i++)
                    target.removeEventListener(events[i], callback);

                if((target.tagName.toLowerCase() == "input" || target.tagName.toLowerCase() == "textarea") &&
                    (options &&
                        (options["immediately"]==1 || options["immediately"].toLowerCase()=="true"))){
                    target.removeEventListener("keyup", callback);
                }
            }
        },

        getErrorStatusInformation: function(node, result){
            if(node.__knot_errorStatusInfo){
                for(var apName in node.__knot_errorStatusInfo)
                    if(node.__knot_errorStatusInfo[apName] && node.__knot_errorStatusInfo[apName].currentStatus)
                        result.push({node:node, accessPointName:apName, error: node.__knot_errorStatusInfo[apName].currentStatus} );
            }
            for(var i=0; i<node.children.length; i++){
                this.getErrorStatusInformation(node.children[i], result)
            }
        },

        //expose to interface
        syncItems:syncItems
    };

    __private.AccessPointManager.registerAPProvider(__private.HTMLAPProvider);
})((function() {
        return this;
    })());