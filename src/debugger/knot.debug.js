(function(window){
    var _debuggerIsRead = false;
    var _debugWindow;
    var _debugButton;
    var _closingCheckIntervalHandler;
    var _cachedLogs = [];
    var _cachedDebugLogs = [];
    window.knotjsDebugger ={
        pushCached:function(){
            _debuggerIsRead = true;
            for(var i=0; i<_cachedLogs.length; i++){
                logger(_cachedLogs[i].level, _cachedLogs[i].level.message, _cachedLogs[i].level.exception);
            }
            _cachedLogs.length = 0;
            for(var i=0; i< _cachedDebugLogs.length; i++){
                callDebugger(_cachedDebugLogs[i].func, _cachedDebugLogs[i].args);
            }
            _cachedDebugLogs.length = 0;
        }
    };

    var logger = function(level, msg, exception){
        var log = {level:level, message:msg, exception:exception, time:new Date()};
        if(!_debuggerIsRead){
            _cachedLogs.push(log);
        }
        else{
            try{
                if(_debugWindow)
                    _debugWindow.calledByOpener.log(log);
                }
            catch(err) {
                //skip
            }
        }
    }

    function showDebugWindow(dir){
        var url = dir + "debugger.html";
        var name =  window.location.href + window.location.pathname;
        _debugWindow = window.open(url, "knotDebugger_" + name, "width=700,height=600,resizable=yes,scrollbars=yes");
    }
    function startDebugger(){
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
        document.body.removeChild(_debugButton);
        setCookie(getCookieName(), "1");

        _closingCheckIntervalHandler = setInterval(function(){
            if(_debugWindow.closed){
                _debuggerIsRead = false;
                _debugWindow=  null;
                document.body.appendChild(_debugButton);
                delCookie(getCookieName());
                clearInterval(_closingCheckIntervalHandler);
            }
        }, 60);
    }

    function callDebugger(funcName, args){
        if(!_debuggerIsRead){
            _cachedDebugLogs.push({func:funcName, args:args});
        }
        else{
            try{
                _debugWindow.calledByOpener.debugger[funcName].apply(_debugWindow.calledByOpener.debugger, args);
            }
            catch (err){
                //skip error
            }
        }
    }
    var debuggerProxy = {
        knotChanged:function(leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight){
            callDebugger("knotChanged", arguments);
        },
        knotTied: function(leftTarget, rightTarget, knotOption){
            callDebugger("knotTied", arguments);
        },
        knotUntied:function(leftTarget, rightTarget, knotOption){
            callDebugger("knotUntied", arguments);
        },
        nodeAdded: function(node){
            callDebugger("nodeAdded", arguments);
        },
        nodeRemoved: function(node){
            callDebugger("nodeRemoved", arguments);
        }
    };

    window.Knot.Advanced.registerLog(logger);
    window.Knot.Advanced.registerDebugger(debuggerProxy);

    function setCookie(cname, cvalue) {
        var d = new Date();
        d.setTime(d.getTime() + (365*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    }
    function delCookie(cname){
        document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    }
    function parseHTML (html){
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.childNodes[0];
    }
    function getCookieName(){
        return "knot-debugger-show-debug-window";
    }
    window.addEventListener("load", function(){
        _debugButton = parseHTML('<button style="padding: 3px 5px;position: absolute;bottom:4px;right:4px;z-index: 9999999999;box-shadow: 0px 0px 4px black">Knot.js Debugger</button>');
        document.body.appendChild(_debugButton);

        if(getCookie(getCookieName())){
            startDebugger();
        }
        _debugButton.onclick = function(){
            startDebugger();
        };
    });
})((function() {
        return this;
    })());