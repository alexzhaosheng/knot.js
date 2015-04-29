(function(){

    var __private = Knot.getPrivateScope();

    var setAttachedData = function(n, c){
        if(n.__knot_parsedOptions){
            c.__knot_parsedOptions =  JSON.parse(JSON.stringify( n.__knot_parsedOptions));
            c.__knot_parsedOptions.isTemplate = false;
        }
        else{
            c.__knot_cbs_options = n.__knot_cbs_options;
        }
        for(var i=0; i< n.children.length; i++)
            setAttachedData(n.children[i], c.children[i]);
    }

    var _itemTemplates = {};

    ///////////////////////////////////////////////////////////
    // item template management and item sync
    ///////////////////////////////////////////////////////////
    __private.TemplateMgr = {
        cloneTemplateNode: function(node){
            var cloned = node.cloneNode(true);
            setAttachedData(node, cloned);
            return cloned;
        },

        createItemFromTemplate: function (knotInfo, data){
            var node = knotInfo.node;
            if(typeof(knotInfo.itemTemplate) == "function"){
                return knotInfo.itemTemplate(data, node)
            }
            else{
                return __private.TemplateMgr.cloneTemplateNode(knotInfo.itemTemplate);
            }
        },

        initTemplate:function(id){
            if(_itemTemplates[id])
                return _itemTemplates[id];

            var template = document.getElementById(id);
            if(template)
                template.parentNode.removeChild(template);
            else{
                template = __private.Utility.getObjectInGlobalScope(id);
                if(template && typeof(template) != "function"){
                    throw new Error("The item template must be a dom element or a callback function");
                }

                if(!template)
                    throw new Error("Failed to find item template with name:" + id);
            }
            _itemTemplates[id] = template;
            return template;
        },

        setupItemTemplate: function(info){
            if(info.itemTemplate)
                return;
            var template;
            if(!info.options.valueConverters || !info.options.valueConverters["foreach"]){
                template = info.node.children[0];
                if(!template){
                    throw new Error("No item template defined. foreach binding requires item template");
                }
                info.node.removeChild(template);
            }
            else{
                var s = info.options.valueConverters["foreach"];
                if(_itemTemplates[s])
                    template = _itemTemplates[s];
                else
                    template = __private.TemplateMgr.initTemplate(s);
            }

            info.itemTemplate = template;
        },
    }

})();