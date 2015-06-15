(function(window){
    var __private = window.Knot.getPrivateScope();

    var htmlEventInfo = [];
    htmlEventInfo["input.value"] = "change,keyup";
    htmlEventInfo["input.checked"] = "change";
    htmlEventInfo["select.selectedindex"] = "change";
    htmlEventInfo["select.value"] = "change";

    __private.HTMLAPHelper = {
        getSelectorFromAPName:function(apName){
        var p =apName.indexOf(".");
        if(p <0)
            return apName;
        else
            return __private.Utility.trim(apName.substr(0, p));
        },
        getPropertyNameFromAPName:function (apName){
            var p =apName.indexOf(".");
            if(p<0)
                return null;
            else
                return __private.Utility.trim(apName.substr(p+1))
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
        }
    }

    function getTemplateName(apName){
        var sections = apName.split("<");
        return __private.Utility.trim(sections[1]);
    }
    function removeNodeCreatedFromTemplate(node){
        __private.HTMLKnotManager.clearBinding(node);
        node.parentNode.removeChild(node);
        __private.Debugger.nodeRemoved(node);
    }
    function setContent(target, apName, value){
        var currentContent =  target.childNodes[0];
        if(!currentContent){
            if(value === null || typeof(value) === "undefined")
                return;
            var n  = __private.HTMLKnotManager.createFromTemplateAndUpdateData(getTemplateName(apName), value);
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
                if( __private.HTMLKnotManager.isDynamicTemplate(getTemplateName(apName))){
                    removeNodeCreatedFromTemplate(currentContent);
                    currentContent  = __private.HTMLKnotManager.createFromTemplateAndUpdateData(getTemplateName(apName), value);
                    if(currentContent){
                        target.appendChild(currentContent, value);
                        __private.Debugger.nodeAdded(n);
                    }
                }

                __private.HTMLKnotManager.updateDataContext(currentContent, value);
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

    function setForeach(node, apName, values){
        var templateName = getTemplateName(apName);
        //take null values as empty array.
        if(!values){
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
                var n = __private.HTMLKnotManager.createFromTemplateAndUpdateData(templateName, values[i])
                if(n){
                    addChildTo(node, n, i);
                    __private.Debugger.nodeAdded(n);
                }
            }
        }

        for (var i = node.children.length - 1; i >= values.length; i--) {
            removeNodeCreatedFromTemplate(node.children[i])
        }
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
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
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
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
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
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
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
                target  = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(__private.Utility.startsWith(apName, "content")){
                setContent(target, apName, value);
            }
            else if(__private.Utility.startsWith(apName, "foreach")){
                setForeach(target, apName, value);
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
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
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
        monitor: function(target, apName, callback){
            if(apName[0] == "!"){
                if(apName[1] == "#"){
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName.substr(1)));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName.substr(1));
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
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }

                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var events = htmlEventInfo[eventKey].split(",");
                for(var i=0; i<events.length; i++)
                    target.addEventListener(events[i], callback);
            }
        },
        stopMonitoring: function(target, apName, callback){
            if(apName[0] == "!"){
                if(apName[1] == "#"){
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName.substr(1)));
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
                    target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                    apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
                }
                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var events = htmlEventInfo[eventKey].split(",");
                for(var i=0; i<events.length; i++)
                    target.removeEventListener(events[i], callback);
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
        }
    };

    __private.AccessPointManager.registerAPProvider(__private.HTMLAPProvider);
})((function() {
        return this;
    })());