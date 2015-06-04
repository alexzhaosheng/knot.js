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
    __private.HTMLAPProvider={
        doesSupport:function(target, apName){
            //if start from "#", then it's a selector
            if(apName[0] == "#"){
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
            else{
                return getPropertyFromElemnt(target, apName);
            }
        },
        setValue: function(target, apName, value){
            if(apName[0] == "#"){
                var element = document.querySelector(getSelectorFromAPName(apName));
                if(element)
                    __private.Utility.setValueOnPath(element, getPropertyNameFromAPName(apName), value);
            }
            else{
                __private.Utility.setValueOnPath(target, apName, value);
            }
        },
        doesSupportMonitoring: function(target, apName){
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
            if(apName[0] == "#"){
                target = document.querySelector(getSelectorFromAPName(apName));
                apName = getPropertyNameFromAPName(apName);
            }
            var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
            var event = htmlEventInfo[eventKey];
            target.addEventListener(event, callback);
        },
        stopMonitoring: function(target, apName, callback){
            if(apName[0] == "#"){
                target = document.querySelector(getSelectorFromAPName(apName));
                apName = getPropertyNameFromAPName(apName);
            }
            var eventKey = target.tagName.toLowerCase() + "." +apName.toLowerCase();
            var event = htmlEventInfo[eventKey];
            target.removeEventListener(event, callback);
        }
    };

    __private.AccessPointManager.registerAPProvider(__private.HTMLAPProvider);
})();