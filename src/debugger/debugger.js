(function(window){
    function parseHTMLInOpener (html){
        var div = window.opener.document.createElement('div');
        div.innerHTML = html;
        return div.childNodes[0];
    };

    var _elementPositionMask = $(parseHTMLInOpener('<div style="position: absolute; z-index: 99999999; border: 1px solid darkred">' +
        '<div style="width: 100%;height:100%; background-color: rgba(255,0,0,0.3);border:1px solid lightpink;"></div>' +
        '<div style="position: absolute; background-color: lightgoldenrodyellow;border: 1px solid lightgray;padding: 2px 5px;font-size: 0.9em"></div>' +
        '</div>'));

    var _mouseTip = $(parseHTMLInOpener('<div style="z-index: 99999999; position: absolute; background-color: lightgoldenrodyellow;border: 1px solid lightgray;padding: 2px 5px;font-size: 0.9em"></div>'));
    var _currentMaskTimeoutHandler = 0;
    window.debuggerModel ={
        domTree:null,

        locateElement:function(){
            try{
                var closestVisibleEle = getClosestVisibleElement($(this.node));
                var pos = closestVisibleEle.offset();
                _elementPositionMask.css("left", pos.left).css("top",pos.top)
                    .width(Math.max(20, closestVisibleEle.outerWidth()))
                    .height(Math.max(20, closestVisibleEle.outerHeight()))
                    .find("div:nth-child(2)").css("top",_elementPositionMask.height()+3).text(this.description);

                $(window.opener.document.body).append(_elementPositionMask);
            }
            catch (err){
                alert(err.message);
            }

            clearTimeout(_currentMaskTimeoutHandler);
            _currentMaskTimeoutHandler = setTimeout(function(){
                _elementPositionMask.remove();
                _currentMaskTimeoutHandler = 0;
            }, 3*1000);
            _elementPositionMask[0].scrollIntoView();
        },

        checkDataContext: function(){
            var content = JSON.stringify(this.dataContext, null, 4);
            $("#dataContextViewer").show()
                .find("textarea").val(content);
            $("#dataContextViewer").find(".nodeDescription").text(this.description);
        }
    };


    function getClosestVisibleElement(element){
        if(element.offset().left == 0 && element.offset().top == 0){
            if(element[0].tagName.toLocaleLowerCase() == "body"){
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


    function getAPDescription(ap){
        if(ap.isComposite){
            return  "(" +
                ap.childrenAPs.map(function(t){return getAPDescription(t);}).join(" & ")
            ")>" + ap.nToOnePipe;
        }
        else{
            var pipes = ap.pipes?ap.pipes.join(" > "):"";
            if(pipes)
                return ap.description+" > " + pipes;
            else
                return ap.description;
        }
    }
    function getKnotOptionsStr(options){
        return getAPDescription(options.leftAP) + " : " + getAPDescription(options.rightAP);
    }

    function generateDOMTree(node){
        var nodeInfo = {
            isExpanded:true,
            childrenInfo: []
        }

        for(var i=0; i<node.children.length; i++){
            var info =generateDOMTree(node.children[i]);
            if(info)
                nodeInfo.childrenInfo.push(info);
        }

        if(!node.__knot && nodeInfo.childrenInfo.length == 0)
            return null;

        if(node.__knot){
            nodeInfo.dataContext = node.__knot.dataContext;
            if(node.__knot.options){
                nodeInfo.options = [];
                for(var i=0; i< node.__knot.options.length; i++){
                    nodeInfo.options.push(getKnotOptionsStr(node.__knot.options[i]));
                }
            }
        }

        nodeInfo.description = getHTMLElementDescription(node);
        nodeInfo.node = node;
        return nodeInfo;
    }

    function getHTMLElementDescription(element){
        var description = element.tagName;
        if(element.id){
            description += "[#" + element.id+"]";
        }
        else if(element.className){
            description += "[" + element.className.split(" ")
                .filter(function(t){return t.trim()!="";})
                .map(function(t){return "."+t;})
                .join(" ")+ "]";
        }
        return description;
    }

    function searchInNode(node, keyword){
        node.isHighlighted = keyword? (node.description.toLowerCase().indexOf(keyword)>=0):false;
        for(var i=0;i<node.childrenInfo.length; i++){
            searchInNode(node.childrenInfo[i], keyword);
        }
    }
    function searchByNode(node, targetNode){
        var found = false;
        for(var i=0;i<node.childrenInfo.length; i++){
            if(searchByNode(node.childrenInfo[i], targetNode))
                found = true;
        }

        if(!found)
            node.isHighlighted = (node.node == targetNode);
        return found || node.isHighlighted;
    }

    window.Knot.ready(function(succ, err){
        if(!succ){
            alert(err.message);
            return;
        }

        if(!window.opener){
            alert("This page should only be opened by Knot debugger.")
            return;
        }

        $("#ownerWindowInfo").text((window.opener.document.title?window.opener.document.title:"untitled") + " ["+ window.opener.location+"]");

        $("#locateElementButton").click(function(){
            $("#fullWindowMessage").show().find("div").text("Use mouse left button to pick an element from the original page.");
            var downHandler = function(arg){
                var e = window.opener.document.elementFromPoint(arg.clientX, arg.clientY);
                searchByNode(window.debuggerModel.domTreeNodes[0], e);
                window.opener.removeEventListener("mousedown", downHandler, true);
                arg.preventDefault();
                $("#fullWindowMessage").hide();
                _mouseTip.remove();
            };
            window.opener.addEventListener("mousedown",downHandler , true);

            $(window.opener.document.body).append(_mouseTip);
            var mouseMoveHandler = function(arg){
                var e = window.opener.document.elementFromPoint(arg.clientX, arg.clientY);
                if(e){
                    _mouseTip.text(getHTMLElementDescription(e));
                }
                _mouseTip.css("top",window.opener.document.body.scrollTop +  arg.clientY+25).css("left", window.opener.document.body.scrollLeft +arg.clientX);
            };
            window.opener.addEventListener("mousemove",mouseMoveHandler , true);
        });

        $("#searchButton").click(function(){
            searchInNode(window.debuggerModel.domTreeNodes[0], $("#searchText").val().toLowerCase().trim());
        });
        $("#searchText").keyup(function(e){
            if(e.which == 13)
                searchInNode(window.debuggerModel.domTreeNodes[0], $("#searchText").val().toLowerCase().trim());
        });

        $("#closeDataContextViewer").click(function(){
            $("#dataContextViewer").hide();
        });

        window.debuggerModel.domTreeNodes = [generateDOMTree(window.opener.document.body)];
    })

})((function() {
        return this;
    })());