/*

    This is a HTML node Access Pointer to provider some shortcuts and cross-browser abilities
    It provides these Access Points for HTML element:

    text

    class: set/get the class of an element. use"+" to add a class while "-" to remove a existing class

    selectedData (for select only): get the selected option's data context, or set the selected option by it's data context

    option (for select only): a shortcut to bind the options of the select to an array.

* */
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    function findOption(options, startIndex, data) {
        for (var i = startIndex; i <options.length; i++) {
            if (__private.HTMLKnotBuilder.getOnNodeDataContext(options[i]) === data) {
                return options[i];
            }
        }
        return null;
    }


    function setupBinding(node, leftApInfo, data, rightApInfo) {
        var ap = __private.OptionParser.parse(leftApInfo + ":" + rightApInfo);
        if (ap.length > 0) {
            __private.KnotManager.tieKnot(node, data, ap[0]);
            if (!node.__knot.options) {
                node.__knot.options = [];
            }
            node.__knot.options.push(ap[0]);
        }
        else {
            node[leftApInfo] = data;
        }
        return ap;
    }

    function removeAllBindings(node) {
        if(!node.__knot || !node.__knot.options) {
            return;
        }
        for(var i=0; i<node.__knot.options.length; i++) {
            __private.KnotManager.untieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
        }
        delete node.__knot.dataContext;
    }

    var _alias = {
        "text":{
            "input.text":"value",
            "textarea":"value",
            "option":"text",
            "span":"innerText",
            "*":"textContent"
        }
    };

    function getKeyForTarget(target) {
        var key = target.tagName.toLowerCase();
        if(key === "input") {
            key += target.type.toLocaleLowerCase();
        }
        return key;
    }
    function getValueFromAlias(target, apDes) {
        var key = getKeyForTarget(target);
        if(_alias[apDes][key]) {
            return target[_alias[apDes][key]];
        }
        else{
            return target[_alias[apDes]["*"]];
        }
    }
    function setValueFromAlias(target, apDes, value) {
        if(typeof(value) === "undefined") {
            value = "";
        }

        var key = getKeyForTarget(target);
        if(_alias[apDes][key]) {
            target[_alias[apDes][key]] = value;
        }
        else{
            target[_alias[apDes]["*"]] = value;
        }
    }

    function setSelectOptions(target, value, options) {
        if (!options) {
            options = {};
        }
        if (!value) {
            value = [];
        }
        for (var i = 0; i < value.length; i++) {
            var option = findOption(target.options, i, value[i]);
            if (!option) {
                option = document.createElement("option");
                __private.HTMLKnotBuilder.setOnNodeDataContext(option, value[i]);
                if (value[i]) {
                    if (options.displayMember) {
                        setupBinding(option, "text", value[i], options.displayMember);
                    }
                    else {
                        option.text = value[i];
                    }
                    if (options.valueMember) {
                        setupBinding(option, "value", value[i], options.valueMember);
                    }
                    else {
                        option.value = value[i];
                    }
                }
                target.options.add(option, i);
            }
            else {
                if (target.options[i].indexOf(option) !== i) {
                    target.options.remove(target.options[i].indexOf(option));
                    target.options.add(option, i);
                }
            }
        }

        for (i = target.options.length - 1; i >= value.length; i--) {
            removeAllBindings(target.options[i]);
            target.options.remove(i);
        }
    }

    function setClass(target, value) {
        if (value) {
            var forceSettingClasses = [];
            var origClassNames = target.className.split(" ");
            var values = value.split(" ");
            for (var i = 0; i < values.length; i++) {
                var v = values[i];
                if (v[0] === "-") {
                    v = v.substr(1).trim();
                    if (origClassNames.indexOf(v) >= 0) {
                        origClassNames.splice(origClassNames.indexOf(v), 1);
                    }
                }
                else if (v[0] === "+") {
                    v = v.substr(1).trim();
                    if (origClassNames.indexOf(v) < 0) {
                        origClassNames.push(v);
                    }
                }
                else{
                    forceSettingClasses.push(v);
                }
            }

            //if there's any class specified as "force setting", ignore any other classes
            if(forceSettingClasses.length > 0) {
                target.className = forceSettingClasses.join(" ");
            }
            else {
                target.className = origClassNames.join(" ");
            }
        }
    }

    function setSelectedData(target, value) {
        for(var i=0; i<target.options.length; i++) {
            if(target.options[i].__knot && target.options[i].__knot.dataContext === value) {
                target.selectedIndex = i;
                return;
            }
        }
        target.selectedIndex = -1;
    }

    var AddonHTMLAPProvider={
        doesSupport: function (target, apName) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }
            //check whether target is html element
            if(target instanceof HTMLElement) {
                if(target.tagName.toLowerCase() ==="select" &&
                    (__private.Utility.startsWith(apName,"options") || apName === "selectedData" || apName === "value")) {
                    return true;
                }
                else if(apName === "class") {
                    return true;
                }
                else if(_alias[apName]) {
                    return true;
                }
            }

            return false;
        },
        getValue: function (target, apName) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(target.tagName.toLowerCase() ==="select" && apName === "selectedData") {
                var selectedOption = target.options[target.selectedIndex];
                if(selectedOption) {
                    return (selectedOption.__knot ? selectedOption.__knot.dataContext : undefined);
                }
                else {
                    return undefined;
                }
            }

            if(target.tagName.toLowerCase() ==="select" && apName === "value"){
                return target.selectedIndex>=0? target.options[target.selectedIndex].value: undefined;
            }

            if(apName === "class") {
                return target.className;
            }
            if(target.tagName.toLowerCase() ==="select" && __private.Utility.startsWith(apName,"options")) {
                return target.options;
            }
            if(_alias[apName]) {
                return getValueFromAlias(target, apName);
            }
            return undefined;
        },
        setValue: function (target, apName, value, options) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(apName === "class") {
                setClass(target, value);
            }
            else if(target.tagName.toLowerCase() ==="select" && apName === "value") {
                for(var i=0; i<target.options.length; i++){
                    //use weak type equal here to make it more flexible
                    if(target.options[i].value == value){
                        target.selectedIndex = i;
                        return;
                    }
                }
                target.selectedIndex = -1;
            }
            else if(target.tagName.toLowerCase() ==="select" && apName === "selectedData") {
                setSelectedData(target, value);
            }
            else if(target.tagName.toLowerCase() ==="select" && __private.Utility.startsWith(apName,"options")) {
                setSelectOptions(target, value, options);
            }
            else if(_alias[apName]) {
                setValueFromAlias(target, apName, value);
            }
        },
        doesSupportMonitoring: function (target, apName) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            return target && target.tagName.toLowerCase() ==="select" && (apName === "selectedData" || apName === "value");
        },
        monitor: function (target, apName, callback) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(target.tagName.toLowerCase() ==="select" &&
                (apName === "selectedData" || apName === "value")) {
                target.addEventListener("change", callback);
            }
        },
        stopMonitoring: function (target, apName, callback) {
            if(apName[0] === "#") {
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPDescription(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPDescription(apName);
            }

            if(target.tagName.toLowerCase() ==="select" &&
                (apName === "selectedData" || apName === "value")) {
                target.removeEventListener("change", callback);
            }
        }
    };

    __private.KnotManager.registerAPProvider(AddonHTMLAPProvider);
})(window);