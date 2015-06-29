/*
    HTMLKnotBuilder takes the responsibility of organizing knot configuration, managing the data context and tie/untie a knot.

    Here is the working process of HTMLKnotBuilder:
    1. Loads the CBS blocks/files
    2. Parse and CBS to extract the CSS selectors and apply the options in CBS to the relevant HTML nodes and merge them with the in-HTML options.
       The results of this step is stored on  node.__knot.cbsOptions.
    3. Parse the options in to knot options object by calling OptionParser, put the parsed result to node.__knot.options
    4. Find out all of the template nodes, remove them from HTML document and register them. Also names the anonymous templates
    5. Travel the DOM tree, tie up the knots by calling KnotManager
* */
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    //store the reference to the nodes with template
    var _nodesWithTemplate = [];

    //remove the comments in CBS
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

    //find the dataContext option from options
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


    //copy the attached data from one tree to the other tree.
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

    //clone the template (along with the attached options)
    function cloneTemplateNode(node) {
        var cloned = node.cloneNode(true);
        copyAttachedData(node, cloned);
        return cloned;
    }

    //create a node from static template (the templates that defined in HTML)
    function createFromStaticTemplate(templateId) {
        if(!__private.HTMLKnotBuilder.templates[templateId]) {
            __private.Log.error( "Failed find template. id:"+templateId);
            return undefined;
        }
        return cloneTemplateNode(__private.HTMLKnotBuilder.templates[templateId]);
    }


    //extract the embedded HTMLs from CBS text
    function extractEmbeddedHTML (res, cbsText) {
        if(!res.HTML) {
            res.HTML = "";
        }
        var pos = 0;
        var textRemains = "";
        var blockInfo = __private.Utility.getBlockInfo(cbsText, pos, "<<{{", "}}>>");
        while(blockInfo !== null) {
            textRemains += cbsText.substr(pos, blockInfo.start-pos);
            res.HTML += cbsText.substr(blockInfo.start+4, blockInfo.end - blockInfo.start-4);
            pos = blockInfo.end + 4;
            blockInfo = __private.Utility.getBlockInfo(cbsText, pos, "<<{{", "}}>>");
        }
        if(pos < cbsText.length) {
            textRemains += cbsText.substr(pos);
        }
        return textRemains;
    }

    //check whether the AP option is template relevant
    function isTemplateRelevantOption(ap) {
        return (ap.description === "foreach" || ap.description === "content");
    }

    //normalize the CBS in block
    //the normalized CBS is a dictionary that comes with CSS selector as it's keys, and an array filled with knot options
    //as it's value
    //Since the CBS block can be embedded into another CBS block, this function is a recursive function.
    //"parentSelector" is the CSS selector in current scope. leave it undefined if there's no CSS selector in current scope
    function normalizeCBS(res, text, parentSelector) {
        var pos = 0;
        var blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
        while(blockInfo !== null) {
            var selector = text.substr(pos, blockInfo.start-pos);
            selector = __private.Utility.trim(selector);

            if(parentSelector){
                selector = selector
                    .split(",")
                    .filter(function(t){return t;})
                    .map(function(t){
                        t = __private.Utility.trim(t);
                        return parentSelector
                            .split(",")
                            .filter(function(p){ return p;})
                            .map(function(p){
                                return __private.Utility.trim(p) + " " + t;
                            })
                            .join(",");
                    })
                    .join(",");
            }

            if(!res[selector]) {
                res[selector] = [];
            }

            var options = text.substr(blockInfo.start+1,  blockInfo.end - blockInfo.start - 1);
            var opArray = __private.Utility.splitWithBlockCheck(options, ";");

            for(var i=0; i< opArray.length; i++) {
                var option = __private.Utility.trim(opArray[i]);
                if(!option) {
                    continue;
                }
                if(option.indexOf("=>") === 0){
                    normalizeCBS(res, option.substr(2), selector);
                }
                else{
                    option = __private.OptionParser.processEmbeddedFunctions(option);
                    if(res[selector].indexOf(option) < 0) {
                        res[selector].push(option);
                    }
                }
            }
            if(res[selector].length ===0){
                delete  res[selector];
            }

            pos = blockInfo.end + 1;
            blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
        }
    }

    //apply CBS to node. parse the CBS options as well as the in-html options and store the result
    //on node.__knot.options
    function applyCBSForNode(node) {
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
                    if(isTemplateRelevantOption(parsedOption[0].leftAP)) {
                        if(_nodesWithTemplate.indexOf(node)<0) {
                            _nodesWithTemplate.push(node);
                        }
                    }
                }
            }
        }

        for(var i=0; i< node.children.length; i++) {
            applyCBSForNode(node.children[i]);
        }
    }

    //use select to attach the CBS to the relevant nodes. the CBS is attached to node.__knot.cbsOption for further reference
    function attachCBS(scope, cbs) {
        for(var selector in cbs) {
            var elements;
            try
            {
                elements = scope.querySelectorAll(selector);
            }
            catch(err) {
                __private.Log.warning("Invalid selector:" + selector, err);
                continue;
            }
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
    }


    var _templateNameCount = 0;
    //register all of the templates in the given scope
    function registerTemplatesInScope (scope) {
        var templateNodes = scope.querySelectorAll("*[knot-template], *[knot-template-id]");
        for(var i=0; i<templateNodes.length; i++) {
            var name;
            if(templateNodes[i].getAttribute("knot-template-id")) {
                name = templateNodes[i].getAttribute("knot-template-id");
            }
            else{
                name = "knot_template_" + _templateNameCount++;
            }
            __private.HTMLKnotBuilder.templates[name] = templateNodes[i];
            templateNodes[i].__knot_template_id = name;
        }
        //turn it into a standard array
        return Array.prototype.slice.apply(templateNodes, [0]);
    }


    //process template options on node. if the option is anonymous template, it'll set the automatically generated name to the option
    function processTemplateOption(node, ap) {
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
            templateNode = __private.HTMLKnotBuilder.templates[template];
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
    }

    //////////////////////////////////////////////////
    // HTMLKnotBuilder
    ////////////////////////////////////////////////////
    __private.HTMLKnotBuilder = {
        //the CBS options to be applied to the global scope.
        publicCBS:{},
        //the CBS options to be applied to the private scope and the HTML in the relevant private scope
        privateCBSInfo:[],

        //the private HTMLs
        privateScope:null,

        //template dictionary
        templates:{},

        //parse CBS blocks and load the external CBS files.
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

        //normalize the CBS options.
        normalize: function (text) {
            text = __private.Utility.trim(text);
            if(__private.Utility.startsWith(text, "$private")) {
                var result = {CBS:{}};
                text = text.substr(8);
                text = extractEmbeddedHTML(result, text);
                normalizeCBS(result.CBS, text);
                this.privateCBSInfo.push(result);
            }
            else{
                normalizeCBS(this.publicCBS, text);
            }
        },

        //apply CBS to private and public scope.
        applyCBS: function () {
            if(this.privateCBSInfo.length > 0) {
                //put the HTMLs in private scope to a serial of DIV nodes, and apply relevant private CBS for them one by one
                //these nodes are added to this.privateScope so that it can be processed  when processing template
                this.privateScope = document.createElement("DIV");
                for(var i=0; i<this.privateCBSInfo.length;i++) {
                    var ele = document.createElement("DIV");
                    ele.innerHTML = this.privateCBSInfo[i].HTML;
                    attachCBS(ele, this.privateCBSInfo[i].CBS);
                    applyCBSForNode(ele);
                    this.privateScope.appendChild(ele);
                }
            }

            attachCBS(document, this.publicCBS);
            applyCBSForNode(document.body);
        },

        //register the template nodes, handle the anonymous templates and handle the relevant options
        processTemplateNodes: function () {
            var templateNodes = [];
            if(this.privateScope) {
                templateNodes = templateNodes.concat(registerTemplatesInScope(this.privateScope));
            }
            templateNodes = templateNodes.concat(registerTemplatesInScope(document));

            //check the options with anonymous templates and set the names of template for them
            for(var i=0; i<_nodesWithTemplate.length; i++) {
                for(var j=0; j<_nodesWithTemplate[i].__knot.options.length; j++) {
                    if(isTemplateRelevantOption(_nodesWithTemplate[i].__knot.options[j].leftAP)) {
                        processTemplateOption(_nodesWithTemplate[i], _nodesWithTemplate[i].__knot.options[j].leftAP);
                    }
                    if(isTemplateRelevantOption(_nodesWithTemplate[i].__knot.options[j].rightAP)) {
                        processTemplateOption(_nodesWithTemplate[i], _nodesWithTemplate[i].__knot.options[j].rightAP);
                    }
                }
            }
            _nodesWithTemplate.length = 0;

            for(i=0; i<templateNodes.length; i++) {
                delete templateNodes[i].__knot_template_id;
                templateNodes[i].removeAttribute("knot-template");
                templateNodes[i].removeAttribute("knot-template-id");
                templateNodes[i].parentNode.removeChild(templateNodes[i]);
            }

            if(this.privateScope) {
                //check whether there's useless HTML
                //the HTMLs in private scope can only be template, and now all templates should have been removed from
                //their parents. there for the private scopes must be empty.
                for(i=0; i<this.privateScope.children.length; i++){
                    if(this.privateScope.children[i].children.length > 0){
                        __private.Log.warning("Useless HTML is detected in private scope." + this.privateScope.children[i]);
                    }
                }
                this.privateScope = null;
            }
        },


        // static template is defined in HTML and must has existed in this.tempaltes
        isDynamicTemplate: function (templateId) {
            return !this.templates[templateId];
        },

        //create a node from template. Note it only create the HTML node, it may not bind the data to the node
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

        //check whether there's data context on the node.
        hasDataContext: function (node) {
            return node.__knot && ("dataContext" in node.__knot);
        },
        //set data context for the node and it's offspring
        setDataContext: function (node, data) {
            this.updateDataContext(node, data);
            if(!node.__knot) {
                node.__knot = {dataContext: data};
            }
            else {
                node.__knot.dataContext = data;
            }
        },

        //untie all knots for the node
        removeKnots: function (node) {
            if(node.__knot && node.__knot.options) {
                for(var i=0; i<node.__knot.options.length; i++) {
                    //dataContext options is handled in a special way
                    if(node.__knot.options[i].leftAP.description === "dataContext") {
                        continue;
                    }
                    __private.KnotManager.untieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },

        //tie all knots for the node
        tieKnots: function (node) {
            if(node.__knot && node.__knot.options) {
                for(var i=0; i<node.__knot.options.length; i++) {
                    //dataContext options is handled in a special way
                    if(node.__knot.options[i].leftAP.description === "dataContext") {
                        continue;
                    }
                    __private.KnotManager.tieKnot(node, node.__knot.dataContext, node.__knot.options[i]);
                }
            }
        },

        //update the data context of the node and all of it's offspring
        updateDataContext: function (node, data) {
            var i;
            if(node.__knot) {
                var dataContextOption = getDataContextKnotOption(node.__knot.options);
                var contextData = data;

                //if there's data context option on the node, we must monitor it's change
                if(dataContextOption) {
                    contextData = __private.KnotManager.getValueThroughPipe(data, dataContextOption.rightAP);
                    if(contextData === __private.KnotManager.objectToIndicateError) {
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
                            __private.HTMLKnotBuilder.updateDataContext(node, data);
                        };

                        dataContextOption.rightAP.provider.monitor(dataContextOption.data, dataContextOption.rightAP.description,dataContextOption.changedCallback,  dataContextOption.rightAP.options);
                    }
                    else{
                        dataContextOption.changedCallback = null;
                    }
                    dataContextOption.hasTiedUpKnot = true;
                }
                this.removeKnots(node);

                __private.KnotManager.notifyKnotChanged(node, data, dataContextOption, contextData, false);

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

        //get the data context of the node
        getDataContextOfHTMLNode: function (node) {
            var n = node;
            while(n) {
                if(n.__knot) {
                    return n.__knot.dataContext;
                }
                n = n.parentNode;
            }
        },

        //clear binding for the node and all of it's offspring, remove not only knot, but also data context monitoring
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

        //binding to body
        bind: function () {
            this.updateDataContext(document.body, null);
        },

        clear: function () {
            this.clearBinding(document.body);
        },

        //set the data context on node without updating anything
        setOnNodeDataContext: function (node, data) {
            if(!node.__knot) {
                node.__knot = {};
            }
            node.__knot.dataContext = data;
        },
        //get the data context on the node
        getOnNodeDataContext: function (node) {
            if(node.__knot) {
                return node.__knot.dataContext;
            }
        },

        //force all of the knots on the node and offspring updating it's value (from left to right)
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
                    __private.KnotManager.forceUpdateValue(node.__knot.options[i].leftAP);
                }
            }

            for(i=0; i< node.children.length; i++) {
                this.forceUpdateValues(node.children[i]);
            }
        }
    };
})(window);