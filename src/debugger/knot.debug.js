(function (window) {
    "use strict";

    var _shouldCacheDebugLog = true;
    var _debugWindow;
    var _debugButton;
    var _closingCheckIntervalHandler;
    var _cachedLogs = [];
    var _cachedDebugLogs = [];
    window.knotjsDebugger ={
        getCachedDebugLog: function(){
            _shouldCacheDebugLog = false;
            var r = _cachedDebugLogs.slice(0);
            _cachedDebugLogs.length = 0;
            return r;
        },
        getCachedLog:function(){
            return _cachedLogs;
        }
    };

    var _levels=["Info", "Warning", "Error"];
    var _currentMaxLevel = 0;
    var logger = function (level, msg, exception) {
        var log = {level:level, message:msg, exception:exception, time:new Date()};
        _currentMaxLevel = Math.max(_currentMaxLevel, _levels.indexOf(level));
        updateDebugButtonVisibility();
        updateDebugButtonStyle();

       _cachedLogs.push(log);

        try{
            if(_debugWindow){
                _debugWindow.calledByOpener.log(log);
            }
        }
        catch(err) {
            console.log("Call logger failed.");
            console.log(err);
        }
    };

    function updateDebugButtonVisibility(){
        if(_currentMaxLevel === 0 && _debugWindow){
            if(_debugButton.parentNode){
                _debugButton.parentNode.removeChild(_debugButton);
            }
        }
        else{
            if(!_debugButton.parentNode) {
                document.body.appendChild(_debugButton);
            }
        }
    }

    function updateDebugButtonStyle() {
        if(_currentMaxLevel <= 0) {
            _debugButton.className = "";
            _debugButton.src = getBaseDir()+"img/debugger.png";
        }
        else{
            _debugButton.className = "knotjs-debugger-flash";
            if(_currentMaxLevel === 1) {
                _debugButton.src = getBaseDir()+"img/debugger_warning.png";
            }
            else{
                _debugButton.src = getBaseDir()+"img/debugger_error.png";
            }
        }
    }

    function getBaseDir() {
        var blocks = window.document.querySelectorAll("script");
        for(var i=0; i<blocks.length; i++) {
            if(blocks[i].src) {
                var src = blocks[i].src;
                if(src.substr(src.length-"knot.debug.js".length) === "knot.debug.js") {
                    return src.substr(0,src.length-"knot.debug.js".length);
                }
            }
        }
        return "";
    }

    function showDebugWindow() {
        var url = getBaseDir() + "debugger.html";
        var name =  window.location.href + window.location.pathname;
        _debugWindow = window.open(url, "knotDebugger_" + name, "width=700,height=700,resizable=yes,scrollbars=yes");

    }
    function startDebugger() {
        if(_debugWindow){
            _debugWindow.focus();
            return;
        }
        showDebugWindow();
        updateDebugButtonVisibility();
        setCookie(getCookieName(), "1");

        _closingCheckIntervalHandler = setInterval(function () {
            if(_debugWindow.closed) {
                _shouldCacheDebugLog = true;
                _debugWindow=  null;
                updateDebugButtonVisibility();
                delCookie(getCookieName());
                clearInterval(_closingCheckIntervalHandler);
            }
        }, 60);
    }

    function callDebugger(funcName, args) {
        if(_shouldCacheDebugLog) {
            _cachedDebugLogs.push({func:funcName, args:args});
        }
        else{
            try{
                _debugWindow.calledByOpener.debugger[funcName].apply(_debugWindow.calledByOpener.debugger, args);
            }
            catch (err) {
                console.log("Call debugger failed. func:"+funcName);
                console.log(err);
            }
        }
    }
    var debuggerProxy = {
        knotChanged: function (leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight) {
            callDebugger("knotChanged", arguments);
        },
        knotTied: function (leftTarget, rightTarget, knotOption) {
            callDebugger("knotTied", arguments);
        },
        knotUntied: function (leftTarget, rightTarget, knotOption) {
            callDebugger("knotUntied", arguments);
        },
        nodeAdded: function (node) {
            callDebugger("nodeAdded", arguments);
        },
        nodeRemoved: function (node) {
            callDebugger("nodeRemoved", arguments);
        },

        errorStatusChanged: function(node, ap, errorStatus){
            callDebugger("errorStatusChanged", arguments);
        }
    };

    window.Knot.Advanced.registerLogger(logger);
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
            while (c.charAt(0)===' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
    function delCookie(cname) {
        document.cookie = cname+"=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    }
    function parseHTML (html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        var r =  div.childNodes[0];
        div.removeChild(r);
        return r;
    }
    function getCookieName() {
        return "knot-debugger-show-debug-window";
    }

    window.addEventListener("load", function () {
        _debugButton = parseHTML('<img id="knotjs-debugger-debuggerButton" title="Show knot.js debugger">');
        updateDebugButtonVisibility();
        updateDebugButtonStyle();
        if(getCookie(getCookieName())) {
            startDebugger();
        }
        _debugButton.onclick = function () {
            startDebugger();
        };
    });

    document.writeln('<style type="text/css">');
    document.writeln('@keyframes knotjs-debugger-flash-keyframes {');
    document.writeln('     0% {opacity: 1;} 50% {opacity: 0.5;} 100% {opacity: 1;}');
    document.writeln('}');
    document.writeln('@-webkit-keyframes knotjs-debugger-flash-keyframes {');
    document.writeln('    0% {opacity: 1;} 50% {opacity: 0.5;} 100% {opacity: 1;}');
    document.writeln('}');
    document.writeln('#knotjs-debugger-debuggerButton{' +
        'width: 32px;height:32px; padding: 3px 5px;position:fixed;bottom:4px;right:4px;z-index: 9999999999;opacity: 0.8;cursor: pointer;' +
        '}');
    document.writeln("#knotjs-debugger-debuggerButton:hover{opacity:1}");
    document.writeln('.knotjs-debugger-flash{-webkit-animation: knotjs-debugger-flash-keyframes 1s infinite;-o-animation: knotjs-debugger-flash-keyframes 1s infinite;animation: knotjs-debugger-flash-keyframes 1s infinite;}')
    document.writeln('</style>');
})(window);