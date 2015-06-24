(function (global) {
    "use strict";
    var provider = {
        doesSupport: function (target, apName) {
            return (target && target.tagName &&  target.tagName.toLowerCase() === "div" && apName === "knot-example-tab");
        },
        getValue: function (target, apName, options) {
            return;
        },
        setValue: function (target, apName, value, options) {
            if (!target.knotExampleTabPage) {
                if (!options || !options.template) {
                    throw new Error("Access point 'knot-example-tab' must come with 'template' option.");
                }
                if (!options || !options.header) {
                    throw new Error("Access point 'knot-example-tab' must come with 'header' option.");
                }
                var model = new TabPageModel(options.header, options.template);
                var tabPageNode = global.Knot.Advanced.createFromTemplate("knot-example-tabPage", model);
                global.Knot.Advanced.setDataContext(tabPageNode, model);
                tabPageNode.knotExampleTabPage = target.knotExampleTabPage = model;
                $(target).append($(tabPageNode));
                tabPageNode.querySelector(".page-contentArea") .onKnotExampleTabPageAdded = function (node) {
                    if(options["@pageAdded"]) {
                        var onAdded =  global.Knot.Advanced.getValueOnPath(this, options["@pageAdded"]);
                        if(onAdded) {
                            onAdded.apply(this, [node]);
                        }
                    }
                };
            }
            target.knotExampleTabPage.setValue(value);
        },
        doesSupportMonitoring: function (target, apName) {
            return false;
        }
    };

    global.Knot.Advanced.registerNamedGlobalSymbol("createKnotExampleTabPageContent", function (data) {
        var model = global.Knot.getDataContext(this);
        var node =  global.Knot.Advanced.createFromTemplate(model.template, data, this);
        global.Knot.Advanced.setDataContext(node, data);
        return node;
    });
    global.Knot.Advanced.registerNamedGlobalSymbol("onPageHeaderClicked", function (evt, node) {
        $(node).closest(".knot-example-tabPage")[0].knotExampleTabPage.selectPage(this);
    });

    var TabPageModel = function (header, template) {
        this.pages = [];
        this.header = header;
        this.template = template;
    };
    var p = TabPageModel.prototype;
    p.setValue = function (value) {
        var that =this;
        if(!value) {
            this.pages = [];
        }
        else{
            this.pages = value.map(function (t) {return {title:t[that.header], data:t, template:that.template};});
            if(this.pages.length > 0) {
                this.pages[0].isSelected = true;
            }
        }
    };
    p.selectPage = function (page) {
        for(var i=0; i<this.pages.length; i++) {
            this.pages[i].isSelected = (this.pages[i] === page);
        }
    };

    global.Knot.Advanced.registerAPProvider(provider);
})(window);