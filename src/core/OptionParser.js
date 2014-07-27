(function(){
    var __private = Knot.getPrivateScope();

///////////////////////////////////////////////////////
    // Parse options
    ///////////////////////////////////////////////////////
    __private.OptionParser = {
        processEmbeddedFunction: function(options){
            var pos = 0;
            while(true){
                var info = __private.Utility.getBlockInfo(options, pos, "${<<", ">>}");
                if(!info)
                    return options;

                var funcStr = options.substr(info.start + 4, info.end-info.start - 4);
                funcStr = "(function(){" + funcStr + "})";
                try{
                    var func = eval(funcStr)
                }
                catch(err){
                    throw new Error("Parse embedded function failed. message:" + err.message + "function:" + funcStr);
                }
                var funcName = "$" + __private.Utility.registerKnotGlobalFunction(func);
                options = [options.substr(0, info.start), funcName, options.substr(info.end+3)].join("");

                pos = info.end+3;
            }
        },
        parseOptionToJSON: function(option) {
            if (!option)
                return {};
            option = option.replace(/\s/g, "");
            option = "{" + option + "}";
            option = option.replace(/;/g,",").replace(/:/g, '":"').replace(/,/g, '","').replace(/}/g, '"}').replace(/{/g, '{"').replace(/"{/g, "{").replace(/}"/g, "}");
            try{
                return JSON.parse(option);
            }
            catch(err){
                throw new Error("Parse option failed:" +option + " message:"+err.message);
            }
        },
        //this function extract the value converters/validators definition from the binding setting string
        parseDetailedOptions: function(optionName, detailedOptions, valueConverters, validators) {
            var arr = detailedOptions.split("=");
            for (var i = 1; i < arr.length; i++) {
                if (arr[i][0] == ">")
                    valueConverters[optionName] = arr[i].substr(1);
                if (arr[i][0] == "!")
                    validators[optionName] = arr[i].substr(1).split("&");
            }
            return arr[0];
        },

        //parse the knots options on node
        //if options are specified in CBS, the CBS process codes will put them into "__knot_cbs_options" on the node
        parse: function(node) {
            if(node.__knot_parsedOptions){
                return node.__knot_parsedOptions;
            }
            var options = {};
            var att = node.getAttribute("binding");
            if(att){
                att = this.processEmbeddedFunction(att);
            }
            if(node.__knot_cbs_options){
                if(att){
                    att += ";" + node.__knot_cbs_options;
                }
                else{
                    att=node.__knot_cbs_options;
                }
            }

            if (att) {
                var bindingOptions = this.parseOptionToJSON(att);
                if (bindingOptions.style) {
                    var v = bindingOptions.style;
                    delete bindingOptions.style;
                    for (var s in v) {
                        bindingOptions["style-" + s] = v[s];
                    }
                }
                options.isTemplate = false;
                if(typeof(bindingOptions.isTemplate) != "undified"){
                    options.isTemplate = bindingOptions.isTemplate;
                    delete  bindingOptions.isTemplate;
                }

                var valueConverters = {}, twoWayBinding = {}, validators = {}, bindingToError = {}, actions={};
                for (var p in bindingOptions) {
                    //actions
                    if(p[0] == "@"){
                        actions[p.substr(1)] = bindingOptions[p];
                        delete bindingOptions[p];
                    }
                    //data context
                    else if(p== "dataContext"){
                        options.dataContextPath = bindingOptions[p];
                        delete bindingOptions[p];
                    }
                    else{
                        var v = bindingOptions[p];
                        //two way binding
                        if (v[0] == "*") {
                            twoWayBinding[p] = true;
                            v = v.substr(1);
                        }
                        //validating result binding
                        if (v[0] == "!") {
                            bindingToError[p] = true;
                            twoWayBinding[p] = true;
                            v = v.substr(1);
                        }
                        bindingOptions[p] = this.parseDetailedOptions(p, v, valueConverters, validators);
                    }
                }
                if(!__private.Utility.isEmptyObj(valueConverters))
                    options.valueConverters = valueConverters;
                if(!__private.Utility.isEmptyObj(twoWayBinding))
                    options.twoWayBinding = twoWayBinding;
                if (!__private.Utility.isEmptyObj(bindingToError))
                    options.bindingToError = bindingToError;
                if (!__private.Utility.isEmptyObj(validators))
                    options.validators = validators;
                if(!__private.Utility.isEmptyObj(actions)){
                    options.actions = actions;
                }
                if(!__private.Utility.isEmptyObj(bindingOptions))
                    options.binding = bindingOptions;

            }
            node.__knot_parsedOptions = options;
            return options;
        }
    }
})();