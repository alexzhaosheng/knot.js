(function(window){
    var debugWindow;

    function showDebugWindow(dir){
        var url = dir + "debugger.html";
        debugWindow = window.open(url, "KnotDebuggerWindow", "width=600,height=500,resizable=yes,scrollbars=yes");
    }


    window.__knotDebugger = {

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