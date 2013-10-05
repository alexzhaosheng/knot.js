/*!
 * knot.js knot types
 * 
 * Copyright 2013 Sheng(Alex) Zhao 
 * Released under the MIT license 
 * 
 */
(function (knot) {

    var CommInput = {
        isSupported: function (tagName, valueName) {
            if ((tagName == "INPUT" || tagName=="TEXTAREA") && valueName == "value" ||
                (tagName == "SELECT" && valueName == "selected"))
            {
                return true;
            }
            return false;
        },
        isEditingSupported: function (tagName, valueName) {
            return true;
        },

        getValue: function (element, valueName) {
            var tagName = element.tagName;
            if((tagName == "INPUT" || tagName=="TEXTAREA") && valueName == "value")
                return element.value;
            if (tagName == "SELECT" && valueName == "selected") {
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
        isSupported: function (tagName, valueName) {
            if ((valueName == "text") ||
                startWith(valueName, "style-") ||
                (valueName == "class") ||
                (valueName == "src") ||
                (valueName == "disabled")
               ) {
                return true;
            }
            return false;
        },
        isEditingSupported: function (tagName, valueName) {
            return false;
        },        
        setValue: function (element, valueName, value) {
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
            else if(valueName == "src"){
                element.src = value;
            }
        }
    }
    knot.registerKnotExtension(CommonSetOnlyKnots, "knot_type");



    var DomEventActions = {
        isSupported: function (tagName, action) {
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
