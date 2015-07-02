/*
Knot.js debugger
 */
(function (global) {
    "use strict";
    var _isFilterEnabled = false;

    //this is the red rectangle to indicate the element in opener window
    var _elementPositionMask = $(parseHTMLInOpener('<div style="position: absolute; z-index: 99999999; border: 1px solid darkred">' +
        '<div style="width: 100%;height:100%; background-color: rgba(255,0,0,0.3);border:1px solid lightpink;"></div>' +
        '<div style="position: absolute; background-color: lightgoldenrodyellow;border: 1px solid lightgray;padding: 2px 5px;font-size: 0.9em"></div>' +
        '</div>'));
    var _currentMaskTimeoutHandler = 0;

    //this is the tip that follows the mouse cursor in openner window
    var _mouseTip = $(parseHTMLInOpener('<div style="z-index: 99999999; position: absolute; background-color: lightgoldenrodyellow;border: 1px solid lightgray;padding: 2px 5px;font-size: 0.9em"></div>'));

    //parse html by using the document object from opener, otherwise when the parsed element is added to
    //the opener window, exception may happen.
    function parseHTMLInOpener (html) {
        var div = global.opener.document.createElement('div');
        div.innerHTML = html;
        return div.childNodes[0];
    }

    function getClosestVisibleElement(element) {
        if(element.offset().left === 0 && element.offset().top === 0) {
            if(element[0].tagName.toLocaleLowerCase() === "body") {
                return element;
            }
            else{
                return getClosestVisibleElement(element.parent());
            }
        }
        else{
            return element;
        }
    }

    //show JSON with syntax highlight
    function showJson(message, json) {
        $("#jsonViewer").show()
            .find("code").html(json);
        $("#jsonViewer").find(".jsonViewerMessage").text(message);

        hljs.highlightBlock($("#jsonViewer code")[0]);
    }

    //binding target. this will be the data context of "BODY"
    global.debuggerModel ={
        highestLogLevel:"Info",

        //runtime log
        logs:[],

        //log for the changes of the knots
        knotChangeLog:[],

        //expander status
        isKnotLogExpanded:false,

        //locate element on opener window by mouse clicking
        onLocateElement: function () {
            try{
                var closestVisibleEle = getClosestVisibleElement($(this.node));
                var pos = closestVisibleEle.offset();
                _elementPositionMask.css("left", pos.left).css("top",pos.top)
                    .width(Math.max(20, closestVisibleEle.outerWidth()))
                    .height(Math.max(20, closestVisibleEle.outerHeight()))
                    .find("div:nth-child(2)").css("top",_elementPositionMask.height()+3).text(this.description);

                $(global.opener.document.body).append(_elementPositionMask);
            }
            catch (err) {
                global.alert(err.message);
            }

            clearTimeout(_currentMaskTimeoutHandler);
            _currentMaskTimeoutHandler = setTimeout(function () {
                _elementPositionMask.remove();
                _currentMaskTimeoutHandler = 0;
            }, 3*1000);
            _elementPositionMask[0].scrollIntoView();
        },

        onShowDataContext: function () {
            var content = JSON.stringify(this.dataContext, null, 4);
            showJson("Current data context for \""+ this.description + "\"", content);
        },

        onShowKnotDetail: function () {
            var content = JSON.stringify(this.latestValueInfo, null, 3);

            showJson("Current value for knot \"" + this.description + "\"" , content);
        },

        onShowKnotValueLogDetail: function () {
            var content = JSON.stringify(this.value, null, 4);
            showJson("Current data context for \""+ this.nodeDescription + " " + this.knotOption.description + "\"", content);
        },

        //play the color animation when value is changed
        onKnotValueChanged: function (apDes, value) {
            if(!value) {
                $(this).stop();
            }
            else{
                $(this).stop()
                    .css("backgroundColor", "#0bac45")
                    .animate({backgroundColor:"transparent"}, 3000);
            }
        },

        onClearLogs: function () {
            global.debuggerModel.knotChangeLog.length = 0;
            global.debuggerModel.knotChangeLog.notifyChanged();
        }
    };


    // save/restore the status of the expander
    global.Knot.monitorObject(global.debuggerModel, "isKnotLogExpanded", function (p, oldValue, newValue) {
        $.cookie('knot-debugger-knot-log-expanded', newValue?"1":"0", { expires: 365 });
    });
    global.debuggerModel.isKnotLogExpanded = $.cookie("knot-debugger-knot-log-expanded") === "1";



    //////////////////////////////////////////////////////////
    //search, highlight and collapse/expand tree
    //////////////////////////////////////////////////////////

    //use keyword to search DOM, then highlight the result
    function searchInNode(node, keyword) {
        var i;
        node.isHighlighted = keyword? (node.description.toLowerCase().indexOf(keyword)>=0):false;
        if(node.options) {
            for(i=0; i< node.options.length; i++) {
                node.options[i].isHighlighted = (node.options[i].description.toLowerCase().indexOf(keyword) >=0);
            }
        }
        for(i=0;i<node.childrenInfo.length; i++) {
            searchInNode(node.childrenInfo[i], keyword);
        }
    }
    //highlight the target node while remove highlight from the other nodes
    function searchByNodeInTree(treeRoot, targetNode) {
        var found = false;
        for (var i = 0; i < treeRoot.childrenInfo.length; i++) {
            if (searchByNodeInTree(treeRoot.childrenInfo[i], targetNode)) {
                found = true;
            }
        }

        if (treeRoot.options) {
            for (i = 0; i < treeRoot.options.length; i++) {
                treeRoot.options[i].isHighlighted = false;
            }
        }
        if (!found)
            treeRoot.isHighlighted = (treeRoot.node === targetNode);
        return found || treeRoot.isHighlighted;
    }

    function searchByNode(node, targetNode) {
        try{
            while(!searchByNodeInTree(node, targetNode) && targetNode.parentNode){
                targetNode = targetNode.parentNode;
            }
        }
        catch (err){
            alert(err.toString());
        }
    }

    //collapse node as many as possible to emphasis the highlighted ones
    function collapseIrrelevantNodes(node) {
        var collapse = true;
        for(var i=0;i<node.childrenInfo.length; i++) {
            if(collapseIrrelevantNodes(node.childrenInfo[i])) {
                collapse = false;
            }
        }

        var highlighted = node.isHighlighted;
        if(!highlighted && node.options) {
            for(var i=0; i<node.options.length;i++) {
                if(node.options[i].isHighlighted)
                {
                    highlighted = true;
                    break;
                }
            }
        }
        node.isExpanded = highlighted || !collapse;
        return node.isExpanded;
    }
    function expandAll(node) {
        for(var i=0;i<node.childrenInfo.length; i++) {
            expandAll(node.childrenInfo[i]);
        }
        node.isExpanded = true;
    }


    //////////////////////////////////////////////////////////
    //find node in tree
    //////////////////////////////////////////////////////////

    function findNodeInTree(nodeInfo, node) {
        if(nodeInfo.node === node) {
            return nodeInfo;
        }
        for(var i=0; i<nodeInfo.childrenInfo.length; i++) {
            var info = findNodeInTree(nodeInfo.childrenInfo[i], node)
            if(info) {
                return  info;
            }
        }
        return null;
    }
    function getNodeInfo(node) {
        for(var i=0; i<global.debuggerModel.domTreeNodes.length; i++) {
            var info = findNodeInTree(global.debuggerModel.domTreeNodes[i], node);
            if(info) {
                return info;
            }
        }
        return null;
    }


    ///////////////////////////////////////////////////////////
    // generate the information tree of the DOM
    //////////////////////////////////////////////////////////

    function getAPDescription(ap) {
        if(ap.isComposite) {
            return  "(" +
                ap.childrenAPs.map(function (t) {return getAPDescription(t);}).join(" & ") +
            ")>" + ap.nToOnePipe;
        }
        else{
            var pipes = ap.pipes?ap.pipes.join(" > "):"";
            if(pipes) {
                pipes = " > " + pipes;
            }

            var options = "";
            if(ap.options) {
                for(var p in ap.options) {
                    if(options) {
                        options += "; ";
                    }
                    options += p+": "+ap.options[p];
                }
                if(options) {
                    options = "[" + options + "]";
                }
            }

            return ap.description+options + pipes;
        }
    }
    function getKnotOptionsStr(options) {
        return getAPDescription(options.leftAP) + " : " + getAPDescription(options.rightAP);
    }

    //get description tree for the DOM tree start from node
    function generateDOMTree(node) {
        if(node.hasAttribute("knot-debugger-ignore")) {
            return;
        }
        //when node is svg, there's no children. we don't support bind to svg at current stage
        if(!node.children){
            return;
        }
        var nodeInfo = {
            isExpanded:true,
            childrenInfo: []
        };

        for(var i=0; i<node.children.length; i++) {
            var info =generateDOMTree(node.children[i]);
            if(info) {
                nodeInfo.childrenInfo.push(info);
                info.parent = nodeInfo;
            }
        }

        if(!node.__knot && nodeInfo.childrenInfo.length === 0) {
            return null;
        }

        if(node.__knot) {
            nodeInfo.dataContext = node.__knot.dataContext;
            if(node.__knot.options) {
                nodeInfo.options = [];
                for(i=0; i< node.__knot.options.length; i++) {
                    nodeInfo.options.push({
                        description:getKnotOptionsStr(node.__knot.options[i]),
                        knotOption:node.__knot.options[i],
                        latestValueInfo:null
                    });
                }
            }
        }
        else{
            nodeInfo.noKnotSetting = true;
        }

        nodeInfo.description = getHTMLElementDescription(node);
        nodeInfo.node = node;
        return nodeInfo;
    }

    function getHTMLElementDescription(element) {
        var description = element.tagName;
        if(element.id) {
            description += "[#" + element.id+"]";
        }
        else if(element.className) {
            description += "[" + element.className.split(" ")
                .filter(function (t) {return t.trim()!="";})
                .map(function (t) {return "."+t;})
                .join(" ")+ "]";
        }
        return description;
    }



    ///////////////////////////////////////////////////////
    // log and debugger that called by the opener
    //////////////////////////////////////////////////////
    var _debugLogCount = 0;
    var _logLevels =  ["Info", "Warning", "Error"];
    global.calledByOpener = {
        log: function (log) {
            if(_logLevels.indexOf(log.level) > _logLevels.indexOf(global.debuggerModel.highestLogLevel)) {
                global.debuggerModel.highestLogLevel = log.level;
            }
            global.debuggerModel.logs.unshift(log);
            //only keep the latest 200 logs
            if(global.debuggerModel.logs.length > 200){
                global.debuggerModel.logs.pop();
            }
        },
        debugger:{
            helper:{
                setIsTiedUp: function (leftTarget,  knotOption, isTiedUp) {
                    var info = getNodeInfo(leftTarget);
                    if(!info) {
                        return;
                    }

                    for(var i=0; i<info.options.length; i++) {
                        if(info.options[i].knotOption == knotOption) {
                            this.options[i].isTiedUp = isTiedUp;
                            return;
                        }
                    }
                }
            },

            knotChanged: function (leftTarget, rightTarget, knotOption, latestValue, isFromLeftToRight) {
                var info = getNodeInfo(leftTarget);
                if(!info) {
                    return;
                }
                for(var i=0; i<info.options.length; i++) {
                    if(info.options[i].knotOption === knotOption) {
                        info.options[i].latestValueInfo = {id:_debugLogCount++, value:latestValue,isFromLeftToRight:isFromLeftToRight};
                        global.debuggerModel.knotChangeLog.unshift({
                            id:info.options[i].latestValueInfo.id,
                            nodeDescription: info.description,
                            knotOption: info.options[i],
                            value:latestValue,
                            isFromLeftToRight:isFromLeftToRight
                        });
                        if(global.debuggerModel.knotChangeLog.length > 200) {
                            global.debuggerModel.knotChangeLog.pop();
                        }
                        return;
                    }
                }
            },

            knotTied: function (leftTarget, rightTarget, knotOption) {
                //not used now
                //this.helper.setIsTiedUp(leftTarget, knotOption, true);
            },
            knotUntied: function (leftTarget, rightTarget, knotOption) {
                //not used now
                //this.helper.setIsTiedUp(leftTarget, knotOption, false);
            },

            nodeAdded: function (node) {
                var n = node;
                if(getNodeInfo(n)) {
                    return;
                }
                while(n && !getNodeInfo(n.parentNode)) {
                    n = n.parentNode;
                }
                if(n) {
                    var info = generateDOMTree(n);
                    if(!info) {
                        return;
                    }
                    var parentInfo = getNodeInfo(n.parentNode);
                    var index =  Array.prototype.indexOf.call(n.parentNode.childNodes, n);
                    parentInfo.childrenInfo.splice(index, 0, info);
                    info.parent = parentInfo;
                }
            },
            nodeRemoved: function (node) {
                var info = getNodeInfo(node);
                if(!info) {
                    return;
                }
                if(info.parent) {
                    info.parent.childrenInfo.splice(info.parent.childrenInfo.indexOf(info), 1);
                    info.parent = null;
                }
            },

            errorStatusChanged: function(node, ap, errorStatus){
                var info = getNodeInfo(node);
                if(!info) {
                    return;
                }
                for(var i=0; i<info.options.length; i++) {
                    if(info.options[i].knotOption.leftAP === ap || info.options[i].knotOption.rightAP === ap){
                        info.options[i].errorStatus = errorStatus;
                        break;
                    }
                }
            }
        }
    };


    function toggleFilter(enabled) {
        _isFilterEnabled = enabled;
        if (_isFilterEnabled) {
            $("#enableFilterButton").addClass("iconButtonChecked");
        }
        else {
            $("#enableFilterButton").removeClass("iconButtonChecked");
        }

        if(_isFilterEnabled) {
            collapseIrrelevantNodes(global.debuggerModel.domTreeNodes[0]);
        }
        else{
            $("#searchText").val("");
            expandAll(global.debuggerModel.domTreeNodes[0]);
        }
    }

    /////////////////////////////////////////////////////
    //initialize
    ////////////////////////////////////////////////////

    global.Knot.ready(function (succ, err) {
        if(!succ) {
            global.alert(err.message);
            return;
        }

        if(!global.opener) {
            global.alert("This page should only be opened by Knot debugger.");
            return;
        }

        var targetWindowTitle =global.opener.document.title?global.opener.document.title:"untitled";
        $("#ownerWindowInfo").text(targetWindowTitle + " ["+ global.opener.location+"]");
        document.title = "Knot.js Debugger - " + targetWindowTitle;

        $("#locateElementButton").click(function () {
            $("#fullWindowMessage").show().find("div").text("Use mouse left button to pick an element from the original page.");
            var downHandler = function (arg) {
                var e = global.opener.document.elementFromPoint(arg.clientX, arg.clientY);
                toggleFilter(false);
                searchByNode(global.debuggerModel.domTreeNodes[0], e);
                toggleFilter(true);
                global.opener.removeEventListener("mousedown", downHandler, true);
                global.opener.removeEventListener("mousemove", mouseMoveHandler);
                arg.preventDefault();
                $("#fullWindowMessage").hide();
                _mouseTip.remove();
                global.opener.document.body.style.cursor = prevCursor;
            };
            global.opener.addEventListener("mousedown",downHandler , true);

            var prevCursor = global.opener.document.body.style.cursor;
            global.opener.document.body.style.cursor = "crosshair";

            $(global.opener.document.body).append(_mouseTip);
            var mouseMoveHandler = function (arg) {
                var e = global.opener.document.elementFromPoint(arg.clientX, arg.clientY);
                if(e) {
                    _mouseTip.text(getHTMLElementDescription(e));
                }
                _mouseTip.css("top",global.opener.document.body.scrollTop +  arg.clientY+25).css("left", global.opener.document.body.scrollLeft +arg.clientX);
            };
            global.opener.addEventListener("mousemove",mouseMoveHandler);
        });

        $("#searchButton").click(function () {
            searchInNode(global.debuggerModel.domTreeNodes[0], $("#searchText").val().toLowerCase().trim());
            toggleFilter(true);
        });
        $("#searchText").keyup(function (e) {
            if(e.which === 13) {
                searchInNode(global.debuggerModel.domTreeNodes[0], $("#searchText").val().toLowerCase().trim());
                toggleFilter(true);
            }
        });

        $("#closeJsonViewer").click(function () {
            $("#jsonViewer").hide();
        });

        $("#enableFilterButton").click(function () {
            toggleFilter(!_isFilterEnabled);
        });

        global.debuggerModel.domTreeNodes = [generateDOMTree(global.opener.document.body)];

        //get cached logs
        var logs = global.opener.knotjsDebugger.getCachedLog();
        for(var i=0; i< logs.length; i++){
            global.calledByOpener.log(logs[i]);
        }
        var debugLog = global.opener.knotjsDebugger.getCachedDebugLog();
        for(i=0; i< debugLog.length; i++){
            global.calledByOpener.debugger[debugLog[i].func].apply(global.calledByOpener.debugger, debugLog[i].args);
        }

        $("#loadingMessage").remove();
    });

})(window);