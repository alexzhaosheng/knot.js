(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    function removeComments(text) {
        if(!text || text === "") {
            return null;
        }
        var pos;
        while((pos = text.indexOf("/*")) >= 0) {
            var np = text.indexOf("*/", pos);
            if(np < 0) {
                throw new Error("Can't find close mark for comment.");
            }
            text = text.substr(0, pos) +text.substr(np + 2);
        }

        var lines = text.split("\n");
        var res = "";
        for(var i = 0; i< lines.length; i++) {
            var sl = lines[i].split("\r");
            for(var j= 0; j < sl.length; j++) {
                if(__private.Utility.trim(sl[j]).substr(0, 2) === "//") {
                    continue;
                }
                res += sl[j];
            }
        }
        return res;
    }

    function getDataContextKnotOption(options) {
        if(!options) {
            return null;
        }
        for(var i=0; i<options.length; i++) {
            if(options[i].leftAP.description === "dataContext") {
                return options[i];
            }
        }
        return null;
    }

    function createFromStaticTemplate(templateId) {
        if(!__private.HTMLKnotManager.templates[templateId]) {
            __private.Log.error( "Failed find template. id:"+templateId);
            return undefined;
        }
        return cloneTemplateNode(__private.HTMLKnotManager.templates[templateId]);
    }

    function copyAttachedData(n, c) {
        if(n.__knot) {
            c.__knot =  JSON.parse(JSON.stringify( n.__knot));
        }
        else{
            delete c.__knot;
        }
        for(var i=0; i< n.children.length; i++) {
            copyAttachedData(n.children[i], c.children[i]);
        }
    }
    function cloneTemplateNode(node) {
        var cloned = node.cloneNode(true);
        copyAttachedData(node, cloned);
        return cloned;
    }

    __private.HTMLKnotManager = {
        publicCBS:{},
        privateCBSScope:[],
        templates:{},
        parseCBS: function () {
            var deferred = new __private.Deferred();
            var blocks = global.document.querySelectorAll('script[type="text/cbs"]');
            var that =this;
            var scriptToLoad = 0;

            for(var i =0; i< blocks.length; i++) {
                if(blocks[i].src) {
                    scriptToLoad ++;
                    (function () {
                        var src = blocks[i].src;
                        var hr = __private.Utility.getXHRS();
                        hr.onreadystatechange = function () {
                            if(hr.readyState === 4) {
                                if(hr.status === 200) {
                                    try{
                                        var text = removeComments(hr.responseText);
                                        that.normalize(text);
                                        scriptToLoad--;
                                        if(scriptToLoad === 0) {
                                            try{
                                                deferred.resolve();
                                            }
                                            catch (err) {
                                                __private.Log.error( "Initialize failed.  message:" + err.message, err);
                                            }
                                        }
                                    }
                                    catch(err) {
                                        __private.Log.error( "Load CBS script error. url:" + src + " message:" + err.message, err);
                                        deferred.reject(err);
                                    }
                                }
                                else{
                                    __private.Log.error( "Load CBS script error. url:" + src + " message:" +hr.statusText);
                                    deferred.reject(new Error( "Load CBS script error. url:" + src + " message:" +hr.statusText));
                                }
                            }
                        };
                        hr.open("GET", src, true);
                        hr.send();
                    })();
                }
                else{
                    try{
                        var text = removeComments(blocks[i].textContent);
                        this.normalize(text);
                    }
                    catch (error) {
                        deferred.reject(error);
                    }
                }
            }
            if(scriptToLoad === 0) {
                deferred.resolve();
            }
            return deferred;
        },

        normalize: function (text) {
            text = __private.Utility.trim(text);
            if(__private.Utility.startsWith(text, "$private")) {
                var result = {CBS:{}};
                text = text.substr(8);
                text = this.extractEmbeddedHTML(result, text);
                this.normalizeCBS(result.CBS, text);
                this.privateCBSScope.push(result);
            }
            else{
                this.normalizeCBS(this.publicCBS, text);
            }
        },

        extractEmbeddedHTML: function (res, text) {
            if(!res.HTML) {
                res.HTML = "";
            }
            var pos = 0;
            var textRemains = "";
            var blockInfo = __private.Utility.getBlockInfo(text, pos, "<<{{", "}}>>");
            while(blockInfo !== null) {
                textRemains += text.substr(pos, blockInfo.start-pos);
                res.HTML += text.substr(blockInfo.start+4, blockInfo.end - blockInfo.start-4);
                pos = blockInfo.end + 4;
                blockInfo = __private.Utility.getBlockInfo(text, pos, "<<{{", "}}>>");
            }
            if(pos < text.length) {
                textRemains += text.substr(pos);
            }
            return textRemains;
        },

        normalizeCBS: function (res, text) {
            var pos = 0;
            var blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            while(blockInfo !== null) {
                var selector = text.substr(pos, blockInfo.start-pos);
                selector = __private.Utility.trim(selector);
                if(!res[selector]) {
                    res[selector] = [];
                }

                var options = text.substr(blockInfo.start+1,  blockInfo.end - blockInfo.start - 1);
                options = __private.OptionParser.processEmbeddedFunctions(options);
                var opArray = __private.Utility.splitWithBlockCheck(options, ";");

                for(var i=0; i< opArray.length; i++) {
                    var option = __private.Utility.trim(opArray[i]);
                    if(res[selector].indexOf(option) < 0) {
                        res[selector].push(option);
                    }
                }

                pos = blockInfo.end + 1;
                blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            }
        },

        _nodesWithTemplate:[],
        applyCBSForNode: function (node) {
            var cbsOptions = null;
            if(node.__knot && node.__knot.cbsOptions) {
                cbsOptions = node.__knot.cbsOptions;
                delete  node.__knot.cbsOptions;
            }

            if(node.attributes.binding && node.attributes.binding.value) {
                if(!cbsOptions) {
                    cbsOptions = [];
                }
                var embeddedOptions = node.attributes.binding.value;
                embeddedOptions = __private.OptionParser.processEmbeddedFunctions(embeddedOptions);
                embeddedOptions = embeddedOptions.split(";").map(function (t) {return __private.Utility.trim(t);});
                cbsOptions = cbsOptions.concat(embeddedOptions);
            }
            if(cbsOptions) {
                for(var j=0; j<cbsOptions.length; j++) {
                    if(!node.__knot) {
                        node.__knot = {options: []};
                    }
                    //each item of "cbsOptions" only contains the option for one knot
                    var parsedOption = __private.OptionParser.parse(cbsOptions[j]);
                    if(parsedOption.length !== 0) {
                        node.__knot.options.push(parsedOption[0]);
                        //template relevant options are only available on the left side. therefore check lfetAP is enough
                        if(this.isTemplateRelevantOption(parsedOption[0].leftAP)) {
                            if(this._nodesWithTemplate.indexOf(node)<0) {
                                this._nodesWithTemplate.push(node);
                            }
                        }
                    }
                }
            }

            for(var i=0; i< node.children.length; i++) {
                this.applyCBSForNode(node.children[i]);
            }
        },

        isTemplateRelevantOption: function (ap) {
            return (ap.description === "foreach" || ap.description === "content");
        },

        applyCBS: function () {
            if(this.privateCBSScope.length > 0) {
                var privateScopeHTML = "";
                for(var i=0; i<this.privateCBSScope.length;i++) {
                    privateScopeHTML += this.privateCBSScope[i].HTML;
                }
                this.privateScope = document.createElement("DIV");
                this.privateScope.innerHTML = privateScopeHTML;
                for(i=0; i<this.privateCBSScope.length;i++) {
                    this.attachCBS(this.privateScope, this.privateCBSScope[i].CBS);
                    this.applyCBSForNode(this.privateScope);
                }
            }

            this.attachCBS(document, this.publicCBS);
            this.applyCBSForNode(document.body);
        },

        attachCBS: function (scope, cbs) {
            for(var selector in cbs) {
                var elements = scope.querySelectorAll(selector);
                if(elements.length === 0) {
                    __private.Log.warning("There is no element selected with selector:" + selector);
                }
                for(var i=0; i<elements.length; i++) {
                    var cbsOptions = cbs[selector].slice(0);
                    if(!elements[i].__knot) {
                        elements[i].__knot = {options: []};
                    }
                    if(elements[i].__knot.cbsOptions) {
                        cbsOptions = elements[i].__knot.cbsOptions.concat(cbsOptions);
                    }
                    elements[i].__knot.cbsOptions = cbsOptions;
                }
            }
        },

        _templateNameCount:0,
        processTemplateNodes: function () {
            var templateNodes = [];
            if(this.privateScope) {
                templateNodes = templateNodes.concat(this.processTemplateNodesForScope(this.privateScope));
            }
            templateNodes = templateNodes.concat(this.processTemplateNodesForScope(document));

            for(var i=0; i<this._nodesWithTemplate.length; i++) {
                for(var j=0; j<this._nodesWithTemplate[i].__knot.options.length; j++) {
                    if(this.isTemplateRelevantOption(this._nodesWithTemplate[i].__knot.options[j].leftAP)) {
                        this.processTemplateOption(this._nodesWithTemplate[i], this._nodesWithTemplate[i].__knot.options[j].leftAP);
                    }
                    if(this.isTemplateRelevantOption(this._nodesWithTemplate[i].__knot.options[j].rightAP)) {
                        this.processTemplateOption(this._nodesWithTemplate[i], this._nodesWithTemplate[i].__knot.options[j].rightAP);
                    }
                }
            }

            this._nodesWithTemplate.length = 0;
            for(i=0; i<templateNodes.length; i++) {
                delete templateNodes[i].__knot_template_id;
                templateNodes[i].removeAttribute("knot-template");
                templateNodes[i].removeAttribute("knot-template-id");
                templateNodes[i].parentNode.removeChild(templateNodes[i]);
            }

            if(this.privateScope) {
                if(this.privateScope.children.length>0) {
                    __private.Log.warning("Useless HTML is detected in private scope." + this.privateScope.innerHTML);
                }
                this.privateScope = null;
            }
        },
        processTemplateNodesForScope: function (scope) {
            var templateNodes = scope.querySelectorAll("*[knot-template], *[knot-template-id]");
            for(var i=0; i<templateNodes.length; i++) {
                var name;
                if(templateNodes[i].getAttribute("knot-template-id")) {
                    name = templateNodes[i].getAttribute("knot-template-id");
                }
                else{
                    name = "knot_template_" + this._templateNameCount++;
                }
                this.templates[name] = templateNodes[i];
                templateNodes[i].__knot_template_id = name;
            }
            //turn it into a standard array
            return Array.prototype.slice.apply(templateNodes, [0]);
        },
        processTemplateOption: function (node, ap) {
            var templateNode;
            if(!ap.options || !ap.options.template) {
                templateNode = node.children[0];
                if(node.children.length > 1) {
                    __private.Log.warning("More than one child is found within '" + __private.HTMLAPHelper.getNodeDescription(node) + '", only the first will be taken as template and the reset will be removed.');
                }
                if(!templateNode) {
                    __private.Log.error("Can't find template within'" + __private.HTMLAPHelper.getNodeDescription(node) + "'");
                    return;
                }
            }
            else{
                var template = ap.options.template;
                //if template is a dynamic template, do nothing
                if(template[0] === "@") {
                    return;
                }
                templateNode = this.templates[template];
                if(!templateNode) {
                    __private.Log.error("Can't find template with selector'" + template + "'");
                    return;
                }
            }

            if(!templateNode.__knot_template_id) {
                __private.Log.error("The template node must be marked with 'knot-template'. Current node:'" + __private.HTMLAPHelper.getNodeDescription(node) + "'");
            }
            if(!ap.options) {
                ap.options = {};
            }
            ap.options.template = templateNode.__knot_template_id;
        },

        //if the template is from template method, we call it dynamic
        isDynamicTemplate: function (templateId) {
            return !this.templates[templateId];
        },

        createFromTemplate: function (template, data, owner) {
            if((typeof(template) === "function") || !this.templates[template]) {
                var newNode;
                var templateFunction;
                if(typeof(template) === "function") {
                    templateFunction = template;
                }
                else{
                    templateFunction = __private.Utility.getValueOnPath(data, template);
                }
                if(typeof (templateFunction) === "function") {
                    newNode = templateFunction.apply(owner, [data]);
                    if(!newNode) {
                        __private.Log.error( "Template function must return a HTML element. template:"+template);
                    }
                }
                else{
                    __private.Log.error( "Unknown template:"+template);
                }
                return newNode;
            }
            else{
                return createFromStaticTemplate(template);
            }
        },

        hasDataContext: function (node) {
            return node.__knot && ("dataContext" in node.__knot);
        },
        setDataContext: function (node, data) {
            this.updateDataContext(node, data);
            if(!node.__knot) {
                node.__knot = {dataContext: data};
            }
            else {
                node.__knot.dataContext = data;
            }
        },

        removeKnots: function (node) {
            if(node.__knot && node.__knot.options) {
                for(var i=0; i<node.__knot.options.length; i++) {
                    if(node.__knot.options[i].leftAP.description === "dataContext") {
                        continue;
                    }
                    __private.AccessPointManager.untieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },
        tieKnots: function (node) {
            if(node.__knot && node.__knot.options) {
                for(var i=0; i<node.__knot.options.length; i++) {
                    if(node.__knot.options[i].leftAP.description === "dataContext") {
                        continue;
                    }
                    __private.AccessPointManager.tieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },

        updateDataContext: function (node, data) {
            var i;
            if(node.__knot) {
                var dataContextOption = getDataContextKnotOption(node.__knot.options);
                var contextData = data;
                if(dataContextOption) {
                    contextData = __private.AccessPointManager.getValueThroughPipe(data, dataContextOption.rightAP);
                    if(contextData === __private.AccessPointManager.objectToIndicateError) {
                        __private.Log.error("Get context data failed. node:" + __private.HTMLAPHelper.getNodeDescription(node));
                        return;
                    }
                    if(dataContextOption.hasTiedUpKnot && contextData === node.__knot.dataContext) {
                        return;
                    }

                    if((dataContextOption.data ||dataContextOption.rightAP.description[0]==="/")  && dataContextOption.changedCallback) {
                        dataContextOption.rightAP.provider.stopMonitoring(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback,  dataContextOption.rightAP.options);
                    }

                    dataContextOption.data = data;
                    if((dataContextOption.data || dataContextOption.rightAP.description[0]==="/")) {
                        dataContextOption.changedCallback = function () {
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

                for(i=0; i<node.childNodes.length; i++) {
                    this.updateDataContext(node.childNodes[i], contextData);
                }

                node.__knot.dataContext = contextData;
                this.tieKnots(node);
            }
            else{
                for(i=0; i<node.childNodes.length; i++) {
                    this.updateDataContext(node.childNodes[i], data);
                }
            }
        },

        getDataContextOfHTMLNode: function (node) {
            var n = node;
            while(n) {
                if(n.__knot) {
                    return n.__knot.dataContext;
                }
                n = n.parentNode;
            }
        },

        clearBinding: function (node) {
            if(node.__knot) {
                var dataContextOption = getDataContextKnotOption(node.__knot.options);
                if(dataContextOption) {
                    if((dataContextOption.data || dataContextOption.rightAP.description[0] === "/") && dataContextOption.changedCallback) {
                        dataContextOption.rightAP.provider.stopMonitoring(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback, dataContextOption.rightAP.options);
                    }

                    dataContextOption.data = null;
                    dataContextOption.changedCallback = null;
                    dataContextOption.hasTiedUpKnot = false;
                }

                this.removeKnots(node);
                delete node.__knot.dataContext;
            }
            for(var i=0; i<node.childNodes.length; i++) {
                this.clearBinding(node.childNodes[i]);
            }
        },

        bind: function () {
            this.updateDataContext(document.body, null);
        },

        clear: function () {
            this.clearBinding(document.body);
        },

        setOnNodeDataContext: function (node, data) {
            if(!node.__knot) {
                node.__knot = {};
            }
            node.__knot.dataContext = data;
        },
        getOnNodeDataContext: function (node) {
            if(node.__knot) {
                return node.__knot.dataContext;
            }
        },

        forceUpdateValues: function (node) {
            var i;
            if(node.__knot && node.__knot.options) {
                for(i=0; i<node.__knot.options.length; i++) {
                    if(node.__knot.options[i].leftAP.description === "dataContext") {
                        continue;
                    }
                    if(node.__knot.options[i].leftAP.description && node.__knot.options[i].leftAP.description[0] === "!") {
                        continue;
                    }
                    __private.AccessPointManager.forceUpdateValue(node.__knot.options[i].leftAP);
                }
            }

            for(i=0; i< node.children.length; i++) {
                this.forceUpdateValues(node.children[i]);
            }
        }
    };
})(window);