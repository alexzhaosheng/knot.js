(function(){
    window.KnotTestUtility = {
        parseHTML: function(html){
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.childNodes[0];
        }
    };

    window.TestKnot= {
        //these are the standard interface of a "Knot"
        isSupported: function (node, valueName) {
            return true;
        },
        isEditingSupported: function (node, valueName) {
            return true;
        },

        getValue: function (element, valueName) {
            if( element.__attachedTestKnotData){
                return  element.__attachedTestKnotData[valueName];
            }
            return undefined;
        },
        setValue: function (element, valueName, value) {
            if(!element.__attachedTestKnotData)
                element.__attachedTestKnotData = {};
            element.__attachedTestKnotData[valueName] = value;
        },
        monitorChange: function (element, valueName, callback) {
            if(!element.__attachedTestKnotEventCallbacks){
                element.__attachedTestKnotEventCallbacks = {};
            }
            if(!element.__attachedTestKnotEventCallbacks[valueName]){
                element.__attachedTestKnotEventCallbacks[valueName] = [];
            }
            element.__attachedTestKnotEventCallbacks[valueName].push(callback);
        },
        stopMonitoring: function (element, valueName, callback) {
            if(element.__attachedTestKnotEventCallbacks[valueName].indexOf(callback) < 0)
                throw new Error("Callback is not found");
            element.__attachedTestKnotEventCallbacks[valueName].splice(element.__attachedTestKnotEventCallbacks[valueName].indexOf(callback), 1);
        },

        //this is used to simulate the events
        changeValue: function(element, valueName, newValue){
            this.setValue(element, valueName, newValue);
            if(element.__attachedTestKnotEventCallbacks && element.__attachedTestKnotEventCallbacks[valueName]){
                var callbacks = element.__attachedTestKnotEventCallbacks[valueName];
                for(var i=0; i<callbacks.length; i++){
                    callbacks[i]();
                }
            }
        }

    };
})();