(function(window){
    var _debugWindow;

    var _cachedLogs = [];
    window.knotjsDebugger ={
        getCachedLogs:function(){
            return _cachedLogs;
        }
    };

    var logger = function(level, msg, exception){
        var log = {level:level, message:msg, exception:exception, time:new Date()};

        _cachedLogs.push(log);
        if(_debugWindow)
            _debugWindow.calledByOpener.log(log);
    }

    function showDebugWindow(dir){
        var url = dir + "debugger.html";
        _debugWindow = window.open(url, "knotDebugger_" + window.location, "width=700,height=600,resizable=yes,scrollbars=yes");
        window.Knot.Advanced.registerDebugger(debuggerProxy);
    }

    var debuggerProxy = {
        knotChanged:function(leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight){
            _debugWindow.calledByOpener.debugger.knotChanged.apply(_debugWindow.calledByOpener.debugger, arguments);
        },
        knotTied: function(leftTarget, rightTarget, knotOption){
            _debugWindow.calledByOpener.debugger.knotTied.apply(_debugWindow.calledByOpener.debugger, arguments);
        },
        knotUntied:function(leftTarget, rightTarget, knotOption){
            _debugWindow.calledByOpener.debugger.knotUntied.apply(_debugWindow.calledByOpener.debugger, arguments);
        },
        nodeAdded: function(node){
            _debugWindow.calledByOpener.debugger.nodeAdded.apply(_debugWindow.calledByOpener.debugger, arguments);
        },
        nodeRemoved: function(node){
            _debugWindow.calledByOpener.debugger.nodeRemoved.apply(_debugWindow.calledByOpener.debugger, arguments);
        }
    };

    window.Knot.Advanced.registerLog(logger);

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