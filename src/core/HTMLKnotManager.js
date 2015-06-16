(function(window){
    var __private = window.Knot.getPrivateScope();

    function removeComments(text){
        if(!text || text == "")
            return null;
        var pos;
        while((pos = text.indexOf("/*")) >= 0){
            var np = text.indexOf("*/", pos);
            if(np < 0){
                throw new Error("Can't find close mark for comment.");
            }
            text = text.substr(0, pos) +text.substr(np + 2);
        }

        var lines = text.split("\n");
        var res = "";
        for(var i = 0; i< lines.length; i++){
            var sl = lines[i].split("\r");
            for(var j= 0; j < sl.length; j++){
                if(__private.Utility.trim(sl[j]).substr(0, 2) == "//"){
                    continue;
                }
                res += sl[j];
            }
        }
        return res;
    }

    function getDataContextKnotOption(options){
        if(!options)
            return null;
        for(var i=0; i<options.length; i++){
            if(options[i].leftAP.description == "dataContext"){
                return options[i];
            }
        }
        return null;
    }

    __private.HTMLKnotManager = {
        normalizedCBS:[],
        templates:[],
        parseCBS:function(){
            var deferred = new __private.Deferred();
            var blocks = window.document.querySelectorAll("script");
            var that =this;
            var scriptToLoad = 0;

            for(var i =0; i< blocks.length; i++){
                if(blocks[i].type == "text/cbs"){
                    if(blocks[i].src){
                        scriptToLoad ++;
                        (function(){
                            var src = blocks[i].src;
                            var hr = __private.Utility.getXHRS();
                            hr.onreadystatechange = function(){
                                if(hr.readyState == 4){
                                    if(hr.status == 200){
                                        try{
                                            var text = removeComments(hr.responseText);
                                            that.normalizeCBS(text);
                                            scriptToLoad--;
                                            if(scriptToLoad == 0)
                                                deferred.resolve();
                                        }
                                        catch(err){
                                            __private.Log.error( "Load CBS script error. url:" + src + " message:" + err.message, err);
                                            deferred.reject(err);
                                        }
                                    }
                                    else{
                                        __private.Log.error( "Load CBS script error. url:" + src + " message:" +hr.statusText);
                                        deferred.reject(new Error( "Load CBS script error. url:" + src + " message:" +hr.statusText));
                                    }
                                }
                            }
                            hr.open("GET", src, true);
                            hr.send();
                        })();
                    }
                    else{
                        try{
                            var text = removeComments(blocks[i].textContent);
                            this.normalizeCBS(text);
                        }
                        catch (error){
                            deferred.reject(error);
                        }
                    }
                }
            }
            if(scriptToLoad == 0)
                deferred.resolve();
            return deferred;
        },

        normalizeCBS: function(text){
            var pos = 0;
            var blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            while(blockInfo != null){
                var selector = text.substr(pos, blockInfo.start-pos);
                selector = __private.Utility.trim(selector);
                if(!this.normalizedCBS[selector])
                    this.normalizedCBS[selector] = [];

                var options = text.substr(blockInfo.start+1,  blockInfo.end - blockInfo.start - 1);
                options = __private.OptionParser.processEmbeddedFunctions(options);
                var opArray = options.split(";");

                for(var i=0; i< opArray.length; i++){
                    var option = __private.Utility.trim(opArray[i]);
                    if(this.normalizedCBS[selector].indexOf(option) < 0)
                        this.normalizedCBS[selector].push(option);
                }

                pos = blockInfo.end + 1;
                blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            }
        },

        _nodesWithTemplate:[],
        applyCBSForNode: function(node){
            var cbsOptions = null;
            if(node.__knot && node.__knot.cbsOptions){
                cbsOptions = node.__knot.cbsOptions;
                delete  node.__knot.cbsOptions;
            }

            if(node.attributes["binding"] && node.attributes["binding"].value){
                if(!cbsOptions)
                    cbsOptions = [];
                var embeddedOptions = node.attributes["binding"].value;
                embeddedOptions = __private.OptionParser.processEmbeddedFunctions(embeddedOptions);
                embeddedOptions = embeddedOptions.split(";").map(function(t){return __private.Utility.trim(t);});
                cbsOptions = cbsOptions.concat(embeddedOptions);
            }
            if(cbsOptions){
                for(var j=0; j<cbsOptions.length; j++){
                    if(!node.__knot)
                        node.__knot={options:[]};
                    //each item of "cbsOptions" only contains the option for one knot
                    var parsedOption = __private.OptionParser.parse(cbsOptions[j]);
                    if(parsedOption.length != 0){
                        node.__knot.options.push(parsedOption[0]);
                        if(this.isTemplateRelevantOption(parsedOption[0].leftAP) || this.isTemplateRelevantOption(parsedOption[0].rightAP)){
                            if(this._nodesWithTemplate.indexOf(node)<0)
                                this._nodesWithTemplate.push(node);
                        }
                    }
                }
            }

            for(var i=0; i< node.children.length; i++)
                this.applyCBSForNode(node.children[i]);
        },

        isTemplateRelevantOption: function(ap){
            return (ap.description == "foreach" || ap.description == "content");
        },

        applyCBS: function(){
            for(var selector in this.normalizedCBS){
                var elements = document.querySelectorAll(selector);
                for(var i=0; i<elements.length; i++){
                    var cbsOptions = this.normalizedCBS[selector].slice(0);
                    if(!elements[i].__knot){
                        elements[i].__knot = {options: []};
                    }
                    if(elements[i].__knot.cbsOptions){
                        cbsOptions = elements[i].__knot.cbsOptions.concat(cbsOptions);
                    }
                    elements[i].__knot.cbsOptions = cbsOptions;
                }
            }

            this.applyCBSForNode(document.body);
        },

        _templateNameCount:0,
        processTemplateNodes: function(){
            var templateNodes = document.querySelectorAll("*[knot-template]");
            for(var i=0; i<templateNodes.length; i++){
                var name;
                if(templateNodes[i].id){
                    name = templateNodes[i].id;
                }
                else{
                    name = "knot_template_" + this._templateNameCount++;
                }
                this.templates[name] = templateNodes[i];
                templateNodes[i].__knot_template_id = name;
            }

            for(var i=0; i<this._nodesWithTemplate.length; i++){
                for(var j=0; j<this._nodesWithTemplate[i].__knot.options.length; j++){
                    if(this.isTemplateRelevantOption(this._nodesWithTemplate[i].__knot.options[j].leftAP))
                        this.processTemplateOption(this._nodesWithTemplate[i], this._nodesWithTemplate[i].__knot.options[j].leftAP);
                    if(this.isTemplateRelevantOption(this._nodesWithTemplate[i].__knot.options[j].rightAP))
                        this.processTemplateOption(this._nodesWithTemplate[i], this._nodesWithTemplate[i].__knot.options[j].rightAP);
                }
            }

            this._nodesWithTemplate.length = 0;
            for(var i=0; i<templateNodes.length; i++){
                delete templateNodes[i].__knot_template_id;
                templateNodes[i].removeAttribute("knot-template");
                templateNodes[i].parentNode.removeChild(templateNodes[i]);
            }
        },
        processTemplateOption: function(node, ap){
            var templateNode
            if(!ap.options || !ap.options["template"]){
                templateNode = node.children[0];
                if(node.children.length > 1){
                    __private.Log.warning("More than one child is found within '" + __private.HTMLAPHelper.getNodeDescription(node) + '", only the first will be taken as template and the reset will be removed.')
                }
                if(!templateNode){
                    __private.Log.error("Can't find template within'" + __private.HTMLAPHelper.getNodeDescription(node) + "'");
                    return;
                }
            }
            else{
                var template = ap.options["template"];
                //if template is a dynamic template, do nothing
                if(template[0] == "@"){
                    return;
                }
                templateNode = __private.HTMLAPHelper.queryElement(template);
                if(!templateNode){
                    __private.Log.error("Can't find template with selector'" + template + "'");
                    return;
                }
            }

            if(!templateNode.__knot_template_id){
                __private.Log.error("The template node must be marked with 'knot-template'. Current node:'" + __private.HTMLAPHelper.getNodeDescription(node) + "'");
            }
            if(!ap.options)
                ap.options = {};
            ap.options["template"] = templateNode.__knot_template_id;
        },

        copyAttachedData: function(n, c){
            if(n.__knot){
                c.__knot =  JSON.parse(JSON.stringify( n.__knot));
            }
            else{
                delete c.__knot;
            }
            for(var i=0; i< n.children.length; i++)
                this.copyAttachedData(n.children[i], c.children[i]);
        },
        cloneTemplateNode: function(node){
            var cloned = node.cloneNode(true);
            this.copyAttachedData(node, cloned);
            return cloned;
        },
        //if the template is from template method, we call it dynamic
        isDynamicTemplate: function(templateId){
            return !this.templates[templateId];
        },
        createFromTemplate:function(templateId){
            if(!this.templates[templateId]){
                __private.Log.error( "Failed find template. id:"+templateId);
                return;
            }
            return this.cloneTemplateNode(this.templates[templateId]);
        },
        createFromTemplateAndUpdateData:function(templateId, data){
            var newNode;
            if(!this.templates[templateId]){
                var templateFunction = __private.Utility.getValueOnPath(data, templateId);
                if(typeof (templateFunction) == "function"){
                    newNode = templateFunction.apply(data, [data]);
                }
                else{
                    __private.Log.error( "Unknown template:"+templateId);
                    return;
                }
            }
            else{
                newNode = this.createFromTemplate(templateId);
            }
            if(!newNode)
                return;

            //keep id of the cloned node so that css specified by id still works for it
            //newNode.removeAttribute("id");

            this.updateDataContext(newNode, data);
            if(!newNode.__knot)
                newNode.__knot = {dataContext:data};
            else
                newNode.__knot.dataContext = data;
            return newNode;
        },

        removeKnots: function(node){
            if(node.__knot && node.__knot.options){
                for(var i=0; i<node.__knot.options.length; i++){
                    if(node.__knot.options[i].leftAP.description == "dataContext")
                        continue;
                    __private.AccessPointManager.untieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },
        tieKnots:function(node){
            if(node.__knot && node.__knot.options){
                for(var i=0; i<node.__knot.options.length; i++){
                    if(node.__knot.options[i].leftAP.description == "dataContext")
                        continue;
                    __private.AccessPointManager.tieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },

        updateDataContext: function(node, data){
            if(node.__knot){
                var dataContextOption = getDataContextKnotOption(node.__knot.options);
                var contextData = data;
                if(dataContextOption){
                    contextData = __private.AccessPointManager.getValueThroughPipe(data, dataContextOption.rightAP);
                    if(dataContextOption.hasTiedUpKnot && contextData === node.__knot.dataContext){
                        return;
                    }

                    if((dataContextOption.data ||dataContextOption.rightAP.description[0]=="/")  && dataContextOption.changedCallback){
                        dataContextOption.rightAP.provider.stopMonitoring(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback,  dataContextOption.rightAP.options);
                    }

                    dataContextOption.data = data;
                    if((dataContextOption.data || dataContextOption.rightAP.description[0]=="/")){
                        dataContextOption.changedCallback = function(){
                            __private.HTMLKnotManager.updateDataContext(node, data);
                        };

                        dataContextOption.rightAP.provider.monitor(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback,  dataContextOption.rightAP.options);
                    }
                    else{
                        dataContextOption.changedCallback = null;
                    }
                    dataContextOption.hasTiedUpKnot = true;
                }
                this.removeKnots(node);

                __private.AccessPointManager.notifyKnotChanged(node, data, dataContextOption, contextData, false);

                for(var i=0; i<node.childNodes.length; i++)
                    this.updateDataContext(node.childNodes[i], contextData);

                node.__knot.dataContext = contextData;
                this.tieKnots(node);
            }
            else{
                for(var i=0; i<node.childNodes.length; i++)
                    this.updateDataContext(node.childNodes[i], data);
            }
        },

        getDataContextOfHTMLNode: function(node){
            var n = node;
            while(n){
                if(n.__knot)
                    return n.__knot.dataContext;
                n = n.parentNode;
            }
        },

        clearBinding:function(node){
            if(node.__knot){
                var dataContextOption = getDataContextKnotOption(node.__knot.options);
                if(dataContextOption){
                    if((dataContextOption.data || dataContextOption.rightAP.description[0] == "/") && dataContextOption.changedCallback){
                        dataContextOption.rightAP.provider.stopMonitoring(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback, dataContextOption.rightAP.options);
                    }

                    dataContextOption.data = null;
                    dataContextOption.changedCallback = null;
                    dataContextOption.hasTiedUpKnot = false;
                }

                this.removeKnots(node);
                delete node.__knot.dataContext;
            }
            for(var i=0; i<node.childNodes.length; i++)
                this.clearBinding(node.childNodes[i]);
        },

        bind: function(){
            this.updateDataContext(document.body, null);
        },

        clear:function(){
            this.clearBinding(document.body);
        },

        setOnNodeDataContext:function(node, data){
            if(!node.__knot)
                node.__knot = {};
            node.__knot.dataContext = data;
        },
        getOnNodeDataContext:function(node){
            if(node.__knot)
                return node.__knot.dataContext;
        }
    }
})((function() {
        return this;
    })());