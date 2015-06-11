(function(){
    var __private = Knot.getPrivateScope();

    function findOption(options, startIndex, data) {
        for (var i = startIndex; i <options.length; i++) {
            if (__private.HTMLKnotManager.getOnNodeDataContext(options[i]) == data) {
                return options[i];
            }
        }
        return null;
    }


    function setupBinding(node, leftApInfo, data, rightApInfo) {
        var ap = __private.OptionParser.parse(leftApInfo + ":" + rightApInfo);
        if (ap.length > 0) {
            __private.AccessPointManager.tieKnot(node, data, ap[0]);
            if (!node.__knot.options)
                node.__knot.options = [];
            node.__knot.options.push(ap[0]);
        }
        else {
            node[leftApInfo] = data;
        }
        return ap;
    }

    function removeAllBindings(node){
        if(!node.__knot || !node.__knot.options)
            return;
        for(var i=0; i<node.__knot.options.length; i++){
            __private.AccessPointManager.untieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
        }
        delete node.__knot.dataContext;
    }

    var AddonHTMLAPProvider={
        doesSupport:function(target, apName){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }
            //check whether target is html element
            if(target instanceof HTMLElement){
                if(target.tagName.toLowerCase()=="select" && (__private.Utility.startsWith(apName,"options") || apName == "selectedData"))
                    return true;
            }

            return false;
        },
        getValue: function(target, apName){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(apName == "selectedData"){
                var selectedOption = target.options[target.selectedIndex];
                if(selectedOption)
                    return selectedOption.__knot?selectedOption.__knot.dataContext:undefined;
                else
                    return undefined;
            }
            if(__private.Utility.startsWith(apName,"options")){
                return target.options;
            }
        },
        setValue: function(target, apName, value){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(apName == "selectedData"){
                for(var i=0; i<target.options.length; i++){
                    if(target.options[i].__knot && target.options[i].__knot.dataContext == value){
                        target.selectedIndex = i;
                        return;
                    }
                }
                target.selectedIndex = -1;
            }
            else if(__private.Utility.startsWith(apName,"options")){
                var def = __private.HTMLAPHelper.parseInAPNameDefinition(apName);
                if(!value)
                    value = [];
                for(var i=0; i<value.length; i++){
                    var option = findOption(target.options, i, value[i]);
                    if(!option){
                        option = document.createElement("option");
                        __private.HTMLKnotManager.setOnNodeDataContext(option, value[i]);
                        if(value[i]){
                            if(def.options["displayMember"]){
                                setupBinding(option, "text", value[i], def.options["displayMember"]);
                            }
                            else{
                                option.text = value[i];
                            }
                            if(def.options["valueMember"]){
                                setupBinding(option, "value", value[i], def.options["valueMember"]);
                            }
                            else{
                                option.value = value[i];
                            }
                        }
                        target.options.add(option, i)
                    }
                    else{
                        if(target.options[i].indexOf(option) != i){
                            target.options.remove(target.options[i].indexOf(option));
                            target.options.add(option, i);
                        }
                    }
                }

                for(var i=target.options.length-1; i>= value.length; i--){
                    removeAllBindings(target.options[i]);
                    target.options.remove(i);
                }
            }
        },
        doesSupportMonitoring: function(target, apName){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(apName == "selectedData"){
                return true;
            }

            return false;
        },
        monitor: function(target, apName, callback){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(apName == "selectedData"){
                target.addEventListener("change", callback);
            }
        },
        stopMonitoring: function(target, apName, callback){
            if(apName[0] == "#"){
                target = document.querySelector(__private.HTMLAPHelper.getSelectorFromAPName(apName));
                apName = __private.HTMLAPHelper.getPropertyNameFromAPName(apName);
            }

            if(apName == "selectedData"){
                target.removeEventListener("change", callback);
            }
        }
    };

    __private.AccessPointManager.registerAPProvider(AddonHTMLAPProvider);
})();