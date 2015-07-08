(function(global){
    "use strict";

    global.Knot.Advanced.registerComponent("SourceTabPage", function(node, component){
        return new SourceTabPage(node);
    });

    function removeIndent(text){
        text = text.trim();
        var lines = text.split("\n");
        var indent = 999999;
        for(var i=1; i<lines.length; i++){
            if(!lines[i].trim()){
                continue;
            }
            var lineIndent= 0;
            while(lines[i][lineIndent] === " " && lineIndent<indent) lineIndent++;
            indent = Math.min(indent, lineIndent);
        }
        if(indent === 0){
            return text;
        }
        else{
            return lines.map(function(t,index){
                if(index === 0){
                    return t;
                }
                else{
                    return t.substr(indent);
                }
            }).join("\n");
        }
    }

    function loadScript(info, onFinished){
        var script = $(info.selector).eq(0)[0];
        if(!script){
            onFinished();
        }
        else{
            if(script.src || script.href) {
                $.ajax({
                    type:"GET",
                    dataType:"text",
                    url:script.src || script.href,
                }).then(function(ret){
                        info.content  = ret;
                        onFinished();
                    },
                    function(err){
                        onFinished();
                    });
            }
            else{
                info.content = removeIndent(info.type==="html"? script.outerHTML: script.innerHTML);
                onFinished();
            }
        }
    }

    var SourceTabPage = function(owner){
        this.height = "";
        this.sourcePages = [];
        this.pageNode = Knot.Advanced.createFromTemplate("sourceTab", this);
        $(this.pageNode).appendTo(owner);
        Knot.Advanced.setDataContext(this.pageNode, this);
    };

    var p = SourceTabPage.prototype;
    p.onPageAdded = function (node) {
        hljs.highlightBlock($(node).find("code")[0]);
    };

    p.setValue = function(apDescription, value, options) {
        if(apDescription === "sourceInfo") {
            var info = value;
            if(value instanceof  String){
                info = JSON.parse(value);
            }
            if(!info){
                this.sourcePages = [];
            }
            else{
                for(var j=0; j< info.length; j++){
                    this.sourcePages.push({type:info[j].type, content:info[j].content, title:info[j].title});
                }
            }
        }

        if(apDescription === "height"){
            this.height = value;
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
        Knot.clear(this.pageNode);
        $(this.pageNode).remove();
    };

    global.SourceCodeHelper = {
        collectSourceCodes:function(codesInfo, onFinished){
            var res = [];
            var scriptLoaded = codesInfo.length;
            for(var i=0; i<codesInfo.length; i++){
                loadScript(codesInfo[i], function(){
                    scriptLoaded --;
                    if(scriptLoaded === 0){
                        for(var j=0; j< codesInfo.length; j++){
                            res.push({type:codesInfo[j].type, content:codesInfo[j].content, title:codesInfo[j].title});
                        }
                        onFinished(res);
                    }
                });
            }
        }
    };

})(window);

