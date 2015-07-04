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



    var knotsOptionsForGlobalObjects = {};
    function setupGlobalObjectKnots(){
        var i;
        for(var selector in knotsOptionsForGlobalObjects){
            (function(){
                var mySelector = selector;
                knotsOptionsForGlobalObjects[mySelector].objectObserveCallback = function(path, oldData, newData){
                    var options = knotsOptionsForGlobalObjects[mySelector].options;
                    if(oldData){
                        for(i=0; i<options.length; i++){
                            __private.KnotManager.untieKnot(oldData, null, options[i]);
                        }
                    }
                    for(i=0; i<options.length; i++){
                        __private.KnotManager.tieKnot(newData, null, options[i]);
                    }
                };
                __private.DataObserver.monitor(global, selector.substr(1), knotsOptionsForGlobalObjects[mySelector].objectObserveCallback);
            })();
            var v = __private.Utility.getValueOnPath(null, selector);
            if(v){
                var options = knotsOptionsForGlobalObjects[selector].options;
                for(i=0; i<options.length; i++){
                    __private.KnotManager.tieKnot(v, null, options[i]);
                }
            }
        }
    }
    function clearGlobalObjectKnots(){
        var i;
        for(var selector in knotsOptionsForGlobalObjects){
            if(knotsOptionsForGlobalObjects[selector].objectObserveCallback){
                __private.DataObserver.stopMonitoring(global, selector.substr(1),  knotsOptionsForGlobalObjects[selector].objectObserveCallback);
            }
            var v = __private.Utility.getValueOnPath(null, selector);
            if(v){
                var options = knotsOptionsForGlobalObjects[selector].options;
                for(i=0; i<options.length; i++){
                    __private.KnotManager.untieKnot(v, null, options[i]);
                }
            }
        }
    }




    //////////////////////////////////////////////////
    // HTMLKnotBuilder
    ////////////////////////////////////////////////////
    __private.HTMLKnotBuilder = {

        //template dictionary
        templates:{},

        addGlobalObjectOption: function(selector, options){
            if(!knotsOptionsForGlobalObjects[selector]){
                knotsOptionsForGlobalObjects[selector] = {options:[]};
            }

            knotsOptionsForGlobalObjects[selector].options = knotsOptionsForGlobalObjects[selector].options.concat(options);
        },

        // static template is defined in HTML and must has existed in this.tempaltes
        isDynamicTemplate: function (template) {
            return (typeof(template) === "function") || !this.templates[template];
        },

        //create a node from template. Note it only create the HTML node, it may not bind the data to the node
        createFromTemplate: function (template, data, owner) {
            if(this.isDynamicTemplate(template)) {
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
            setupGlobalObjectKnots();
            this.updateDataContext(document.body, null);
        },

        clear: function () {
            clearGlobalObjectKnots();
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