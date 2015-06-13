(function(window){
    var debugWindow;

    function showDebugWindow(dir){
        var url = dir + "debugger.html";
        debugWindow = window.open(url, "KnotDebuggerWindow", "width=600,height=500,resizable=yes,scrollbars=yes");

        //window.Knot.Advanced.registerLog(debugWindow.calledByOpener.log);
        window.Knot.Advanced.registerDebugger(debuggerProxy);
    }

    var debuggerProxy = {
        knotChanged:function(leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight){
            debugWindow.calledByOpener.debugger.knotChanged.apply(debugWindow.calledByOpener.debugger, arguments);
        },
        knotTied: function(leftTarget, rightTarget, knotOption){
        },
        knotUntied:function(leftTarget, rightTarget, knotOption){

        },
        dataContextChanged:function(node){

        },

        nodeAdded: function(node){

        },
        nodeRemoved: function(node){

        }
    };

    window.addEventListener("load", function(){
        var blocks = window.document.querySelectorAll("script");
        for(var i=0; i<blocks.length; i++){
            if(blocks[i].src){
                var src = blocks[i].src;
                if(src.substr(src.length-"knot.debug.js".length) == "knot.debug.js"){
                    showDebugWindow(src.substr(0,src.length-"knot.debug.js".length ));
                    break;
                }
            }
        }
    });
})((function() {
        return this;
    })());