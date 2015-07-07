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
                if(option.indexOf("->") === 0){
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


    function processCBSForGlobalObject(selector, cbs) {
        var options = [];

        for (var i = 0; i < cbs[selector].length; i++) {
            options = options.concat(__private.OptionParser.parse(cbs[selector][i]));
        }
        __private.HTMLKnotBuilder.addGlobalObjectOption(selector, options)
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
        if(node.children){
            for(var i=0; i< node.children.length; i++) {
                applyCBSForNode(node.children[i]);
            }
        }

    }

    //use select to attach the CBS to the relevant nodes. the CBS is attached to node.__knot.cbsOption for further reference
    function attachCBS(scope, cbs) {
        var i;
        for(var selector in cbs) {
            if(__private.Utility.startsWith(selector, "/")){
                processCBSForGlobalObject(selector, cbs);
                continue;
            }
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
            for(i=0; i<elements.length; i++) {
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


    //apply CBS to private and public scope.
    function applyCBS(scopes) {
        for(var i=0; i< scopes.length; i++){
            attachCBS(scopes[i].scope, scopes[i].CBS);
            if(scopes[i].scope === document) {
                applyCBSForNode(document.body);
            }
            else {
                applyCBSForNode(scopes[i].scope);
            }
        }
    }

    function getScopes(blocks, privateOnly){
        var scopes = [];
        var globalScopeCBS;
        if(!privateOnly){
            globalScopeCBS = {scope:document, CBS:{}, isGlobalScope:true};
            scopes.push(globalScopeCBS);
        }
        for(var i=0; i<blocks.length; i++){
            var text = removeComments(blocks[i]);
            text = __private.Utility.trim(text);
            if(__private.Utility.startsWith(text, "$private")) {
                var scope = {CBS:{}};
                //remove "$private"
                text = text.substr(8);
                text = extractEmbeddedHTML(scope, text);
                try{
                    //put the HTMLs in private scope to DIV nodes, and apply relevant private CBS for it
                    scope.scope = document.createElement("DIV");
                    scope.scope.innerHTML = scope.HTML;
                    delete scope.HTML;
                }
                catch (err){
                    __private.Log.error("Load private scope HTML error.", err);
                    continue;
                }

                normalizeCBS(scope.CBS, text);
                scopes.push(scope);
            }
            else if(privateOnly){
                __private.Log.error("Can't load CBS. It must be a private CBS!");
            }
            else{
                normalizeCBS(globalScopeCBS.CBS, text);
            }
        }
        return scopes;
    }


    ////////////////////////////////////
    // Template relevant
    /////////////////////////////////////

    //check whether the AP option is template relevant
    function isTemplateRelevantOption(ap) {
        return (ap.description === "foreach" || ap.description === "content");
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
                name = "__knot_template_" + _templateNameCount++;
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
                __private.Log.warning("More than one child is found within '" + __private.HTMLAPHelper.getNodeDescription(node) +
                                        '", only the first will be taken as template and the reset will be removed.');
            }
            if(!templateNode) {
                __private.Log.error("Can't find template within '" + __private.HTMLAPHelper.getNodeDescription(node) + "'");
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

    //register the template nodes, handle the anonymous templates and handle the relevant options
    function processTemplateNodes(scopes) {
        var templateNodes = [];
        var i;
        for(i=0; i<scopes.length; i++){
            templateNodes = templateNodes.concat(registerTemplatesInScope(scopes[i].scope));
        }

        //check the options with anonymous templates and set the names of template for them
        for(i=0; i<_nodesWithTemplate.length; i++) {
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

        for(i=0; i<scopes.length; i++){
            if(scopes[i].isGlobalScope){
                continue;
            }
            //check whether there's useless HTML
            //the HTMLs in private scope can only be template, and now all templates should have been removed from
            //their parents. there for the private scopes must be empty.
            if(scopes[i].scope.children.length > 0){
                __private.Log.warning("Useless HTML is detected in private scope.");
            }

        }
    }

    /////////////////////////////////
    //CBS file handling
    /////////////////////////////////

    var _loadedCBSFiles = [];
    function loadFile(file){
        _loadedCBSFiles.push(file);
        var deferred = new __private.Deferred();
        var hr = __private.Utility.getXHRS();
        hr.onreadystatechange = function () {
            if(hr.readyState === 4) {
                if(hr.status === 200) {
                    deferred.resolve(hr.responseText);
                }
                else{
                    deferred.reject(new Error( "Load CBS script error. url:" + file + " message:" +hr.statusText));
                }
            }
        };
        hr.open("GET", file, true);
        hr.send();
        return deferred;
    }

    //parse CBS blocks and load the external CBS files.
    function parseCBSInDocument() {
        var deferred = new __private.Deferred();
        var blocks = global.document.querySelectorAll('script[type="text/cbs"]');
        var cbsTexts = [];
        var numberOfScriptToLoad = 0;

        var checkIsDone = function(){
            if(numberOfScriptToLoad === 0) {
                try{
                    deferred.resolve(cbsTexts);
                }
                catch (err) {
                    __private.Log.error( "Initialize failed.  message:" + err.message, err);
                }
            }
        };
        for(var i =0; i< blocks.length; i++) {
            if(blocks[i].src) {
                //only load CBS file once
                if(_loadedCBSFiles.indexOf(blocks[i].src) >= 0){
                    continue;
                }
                numberOfScriptToLoad ++;
                (function(){
                    var file = blocks[i].src;
                    loadFile(file).done(function(text){
                            cbsTexts.push(text);
                            numberOfScriptToLoad--;
                            checkIsDone();
                        },
                        function(err){
                            numberOfScriptToLoad--;
                            __private.Log.error( "Load CBS script error. url:" + file , err);
                            checkIsDone(err);
                        });
                })();
            }
            else{
                cbsTexts.push(blocks[i].textContent);
            }
        }
        if(numberOfScriptToLoad === 0) {
            deferred.resolve(cbsTexts);
        }
        return deferred;
    }

    __private.CBSLoader = {
        //parse all of the CBS in document
        loadGlobalScope: function(){
            var deferred = new __private.Deferred();
            parseCBSInDocument()
                .done(function(texts){
                    try{
                        var scopes = getScopes(texts, false);
                        applyCBS(scopes);
                        processTemplateNodes(scopes);
                        deferred.resolve();
                    }
                    catch (err){
                        __private.Log.error( "Initialize failed.  message:" + err.message, err);
                        deferred.reject(err);
                    }
                },
                function(err){
                    deferred.reject(err);
                });
            return deferred;
        },

        loadCBSPackage: function(packageFile){
            var deferred = new __private.Deferred();
            if(_loadedCBSFiles.indexOf(packageFile) >= 0){
                deferred.resolve();
            }
            else{
                loadFile(packageFile).done(function(texts){
                        try{
                            var scopes = getScopes([texts], true);
                            applyCBS(scopes);
                            processTemplateNodes(scopes);
                        }
                        catch (err){
                            __private.Log.error( "Parse CBS package failed. package file:" + packageFile, err);
                            deferred.reject(err);
                        }

                        deferred.resolve();
                },
                function(err){deferred.reject(err);});
            }
            return deferred;
        },

        //this is for unit test. just expose some internal functions
        test:{
            parseCBSInDocument: parseCBSInDocument,
            getScopes: getScopes,
            applyCBS: applyCBS,
            processTemplateNodes: processTemplateNodes
        }
    };

})(window);