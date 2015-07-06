(function (global) {
    "use strict";

    global.Knot.Advanced.registerComponent("TabPage", function(node, component){
        return new TabPage(node);
    });

    var TabPage = function(owner){
        this.pages = [];
        this.pageAdded = null;

        while(owner.children.length > 0){
            this.pages.push({element:owner.children[0], title:owner.children[0].getAttribute("pageTitle")});
            $(owner.children[0]).remove();
        }
        if(this.pages.length > 0){
            this.pages[0].isSelected = true;
        }
        this.tabPageNode = global.Knot.Advanced.createFromTemplate("knot-example-tabPage", this);
        var that =this;
        this.tabPageNode.querySelector(".page-contentArea") .onKnotExampleTabPageAdded = function (node, data) {
            node.appendChild(data.element);
            if(that.pageAdded) {
                that.pageAdded.apply(that, [node, data]);
            }
        };

        $(this.tabPageNode).appendTo(owner);
        global.Knot.Advanced.setDataContext(this.tabPageNode, this);
    };

    var p = TabPage.prototype;
    p.setValue = function(apDescription, value, options) {
        if(apDescription === "pages") {
            if(!options || !options.template){
                throw new Error("No template specified for the tab pages!");
            }
            if(!options.header){
                throw new Error("No header specified for the tab pages!");
            }

            this.pages.splice(0, this.pages.length);
            for(var i=0; i<value.length; i++){
                var page = Knot.Advanced.createFromTemplate(options.template, value[i], this);
                Knot.Advanced.setDataContext(page, value[i]);
                this.pages.push({title:value[i][options.header], element:page});
            }

            if(this.pages.length > 0){
                this.pages[0].isSelected = true;
            }
        }
        if(apDescription === "@pageAdded"){
            this.pageAdded = value;
        }
    };
    p.getValue = function(apDescription, options) {

    };
    p.doesSupportMonitoring = function (apDescription) {
        return false;
    };
    p.monitor = function(apDescription, callback, options){
    };
    p.stopMonitoring = function (apDescription, callback, options) {
    };

    p.dispose = function(){
        Knot.clear(this.tabPageNode);
        $(this.tabPageNode).remove();
    };
    p.selectPage = function(page){
        for(var i=0; i<this.pages.length; i++) {
            this.pages[i].isSelected = (this.pages[i] === page);
        }
    };

    global.Knot.Advanced.registerNamedGlobalSymbol("onPageHeaderClicked", function (evt, node) {
        Knot.getDataContext($(node).closest(".knot-example-tabPage")[0]).selectPage(this);
    });


})(window);