(function(){
    var __private = Knot.getPrivateScope();

    var htmlEventInfo = [];
    htmlEventInfo["input.value"] = "change";
    htmlEventInfo["input.checked"] = "change";
    htmlEventInfo["select.selectedIndex"] = "change";
    htmlEventInfo["select.value"] = "change";

    function getSelectorFromAPName(apName){
        var p =apName.indexOf(".");
        if(p <0)
            return apName;
        else
            return apName.substr(0, p);
    }
    function getPropertyNameFromAPName(apName){
        var p =apName.indexOf(".");
        if(p<0)
            return null;
        else
            return apName.substr(p+1)
    }

    function getPropertyFromElemnt(element, property){
        if(!element)
            return undefined;
        return __private.Utility.getValueOnPath(element, property);
    }

    function getTemplateName(apName){
        var sections = apName.split("<");
        return sections[1];
    }
    function removeNodeCreatedFromTemplate(node){
        __private.HTMLKnotManager.clearBinding(node);
        node.parentNode.removeChild(node);
    }
    function setContent(target, apName, value){
        var currentContent =  target.childNodes[0];
        if(!currentContent){
            if(value === null || typeof(value) === "undefined")
                return;
            var n  = __private.HTMLKnotManager.createFromTemplateAndUpdateData(getTemplateName(apName), value);
            if(n)
                target.appendChild(n, value);
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
                    if(currentContent)
                        target.appendChild(currentContent, value);
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
                if(n)
                    addChildTo(node, n, i);
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
            //@ is start of dom event
            if(apName[0] == "@"){
                return true;
            }

            //!is error status binding with must comes with an id selector
            if(apName[0] == "!"){
                return true;
            }

            //check whether target is html element
            if(target && target.ownerDocument){
                return true;
            }
            return false;
        },
        getValue: function(target, apName){
            if(apName[0] == "#"){
                var element = document.querySelector(getSelectorFromAPName(apName));
                return getPropertyFromElemnt(element, getPropertyNameFromAPName(apName));
            }
            else if(apName[0] == "@"){
                return;
            }
            else if(apName[0] == "!"){
                apName = apName.substr(1);
                if(apName[0] == "#"){
                    target = document.querySelector(getSelectorFromAPName(apName));
                    apName = getPropertyNameFromAPName(apName);
                }
                if(!target)
                    return undefined;
                else{
                    if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName])
                        return null;

                    return target.__knot_errorStatusInfo[apName].currentStatus;
                }
            }
            else{
                if(__private.Utility.startsWith(apName, "content") || __private.Utility.startsWith(apName, "foreach"))
                    return;
                return getPropertyFromElemnt(target, apName);
            }
        },
        setValue: function(target, apName, value){
            if(apName[0] == "#"){
                if(typeof(value) == "undefined")
                    value ="";
                var element = document.querySelector(getSelectorFromAPName(apName));
                if(element)
                    __private.Utility.setValueOnPath(element, getPropertyNameFromAPName(apName), value);
            }
            else if(apName[0] == "@"){
                if(typeof(value) != "function"){
                    __private.Log.error(__private.Log.Source.Knot, "Event listener must be a function!");
                }

                if(target){
                    target.addEventListener(apName.substr(1), function(e){
                        var dataContext = target.__knot.dataContext
                        value.apply(dataContext, [e, target]);
                    });;
                }
            }
            else  if(apName[0] == "!"){
                apName = apName.substr(1);
                if(apName[0] == "#"){
                    target = document.querySelector(getSelectorFromAPName(apName));
                    apName = getPropertyNameFromAPName(apName);
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
                                __private.Log.warning(__private.Log.Source.Knot, "Call error status changed callback error.", error);
                            }
                        }
                    }
                }

            }
            else{
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
            }
        },
        doesSupportMonitoring: function(target, apName){
            if(apName[0] == "!"){
                return true;
            }
            if(apName[0] == "#"){
                target = document.querySelector(getSelectorFromAPName(apName));
                apName = getPropertyNameFromAPName(apName);
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
                    target = document.querySelector(getSelectorFromAPName(apName.substr(1)));
                    apName = getPropertyNameFromAPName(apName.substr(1));
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
                    target = document.querySelector(getSelectorFromAPName(apName));
                    apName = getPropertyNameFromAPName(apName);
                }
                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var event = htmlEventInfo[eventKey];
                target.addEventListener(event, callback);
            }
        },
        stopMonitoring: function(target, apName, callback){
            if(apName[0] == "!"){
                if(apName[1] == "#"){
                    target = document.querySelector(getSelectorFromAPName(apName.substr(1)));
                    apName = getPropertyNameFromAPName(apName.substr(1));
                }
                if(!target.__knot_errorStatusInfo || !target.__knot_errorStatusInfo[apName] || !target.__knot_errorStatusInfo[apName].changedCallbacks)
                    return;
                var index = target.__knot_errorStatusInfo[apName].changedCallbacks.indexOf(callback);
                if(index >= 0)
                    target.__knot_errorStatusInfo[apName].changedCallbacks.splice(index, 1);
            }
            else{
                if(apName[0] == "#"){
                    target = document.querySelector(getSelectorFromAPName(apName));
                    apName = getPropertyNameFromAPName(apName);
                }
                var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
                var event = htmlEventInfo[eventKey];
                target.removeEventListener(event, callback);
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
})();