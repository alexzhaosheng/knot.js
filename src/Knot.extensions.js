/*!
 * knot.js knot types
 * 
 * Copyright 2013 Sheng(Alex) Zhao 
 * Released under the MIT license 
 * 
 */
(function (knot) {

    var CommInput = {
        isSupported: function (node, valueName) {
            var tagName = node.tagName.toUpperCase();
            if (((tagName == "INPUT" || tagName=="TEXTAREA") && valueName == "value") ||
                ((tagName == "INPUT" && node.type.toUpperCase()=="CHECKBOX") && valueName=="checked") ||
                (tagName == "SELECT" && valueName == "selected"))
            {
                return true;
            }
            return false;
        },
        isEditingSupported: function (node, valueName) {
            return true;
        },

        getValue: function (element, valueName) {
            var tagName = element.tagName;
            if((tagName == "INPUT" || tagName=="TEXTAREA") && valueName == "value"){
                return element.value;
            }
            else if((tagName == "INPUT" && element.type.toUpperCase()=="CHECKBOX") && valueName=="checked"){
                return element.checked;
            }
            else if (tagName == "SELECT" && valueName == "selected") {
                var option = element.options[element.selectedIndex];
                if(!option)
                    return null;
                return option.value;                
            }
        },
        setValue: function (element, valueName, value) {
            var tagName = element.tagName;
            if((tagName == "INPUT" || tagName=="TEXTAREA") && valueName == "value"){
                element.value = (typeof (value) == "undefined" ? "" : value);
            }
            else if((tagName == "INPUT" && element.type.toUpperCase()=="CHECKBOX") && valueName=="checked"){
                element.checked = Boolean(value);
            }
            else if (tagName == "SELECT" && valueName == "selected") {
                for (var i = 0; i < element.options.length; i++) {
                    var op = element.options[i];
                    if (op.value == value) {
                        element.selectedIndex = i;
                        return;
                    }
                }
                element.selectedIndex = -1;
            }
        },
        monitorChange: function (element, valueName, callback) {
            element.addEventListener("change", callback);
            return callback;
        },
        stopMonitoring: function (element, valueName, callback) {
            element.removeEventListener("change", callback);
        }
    }
    knot.registerKnotExtension(CommInput, "knot_type");


    function startWith(str, subStr){
        return (str.length > subStr.length && str.substr(0, subStr.length) == subStr);
    }

    var CommonSetOnlyKnots = {        
        isSupported: function (node, valueName) {
            var tagName = node.tagName.toUpperCase();
            if ((valueName == "text") ||
                startWith(valueName, "style-") ||
                (valueName == "class") ||
                (valueName == "src") ||
                (valueName == "title") ||
                (valueName == "disabled") ||
                (valueName == "value" && tagName=="OPTION") ||
                (valueName == "innerHTML")
               ) {
                return true;
            }
            return false;
        },
        isEditingSupported: function (node, valueName) {
            return false;
        },        
        setValue: function (element, valueName, value) {
            var tagName = element.tagName.toUpperCase();

            if (valueName == "text") {
                element.textContent = (typeof (value) == "undefined" ? "" : value);
            }
            else if (startWith(valueName, "style-")) {
                var style = valueName.substr("style-".length);
                element.style[style] = (typeof (value) == "undefined" ? "" : value);
            }
            else if (valueName == "class") {
                element.className = (typeof (value) == "undefined" ? "" : value);
            }
            else if (valueName == "disabled") {
                element.disabled = (typeof (value) == "undefined" ? true : value);
            }
            else if(valueName=="title"){
                element.title = value;
            }
            else if(valueName == "src"){
                element.src = value;
            }
            else if( (valueName == "value" && tagName=="OPTION")){
                element.value = value;
            }
            else if(valueName == "innerHTML"){
                element.innerHTML = value;
            }
        }
    }
    knot.registerKnotExtension(CommonSetOnlyKnots, "knot_type");


    var ResetClassKnot = {
        isSupported: function (node, valueName) {
            var tagName = node.tagName;
            if ((valueName == "resetClass")) {
                return true;
            }
            return false;
        },
        isEditingSupported: function (node, valueName) {
            return false;
        },
        setValue: function (element, valueName, value) {
            element.className = "";
            setTimeout(function(){
                element.className = (typeof (value) == "undefined" ? "" : value);
            }, 1)

        }
    }
    knot.registerKnotExtension(ResetClassKnot, "knot_type");


    var DomEventActions = {
        isSupported: function (node, action) {
            return true;
        },

        prepareAction:function(node, action, callback){
            node.addEventListener(action, callback);
            return callback;
        },

        releaseAction: function(node, action, callback){
            node.removeEventListener(action, callback);
        }
    }
    knot.registerKnotExtension(DomEventActions, "knot_action");
  
})(Knot);
