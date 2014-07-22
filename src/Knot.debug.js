(function(root){
    var COOKIE_KEY_IS_WINDOW_VISIBLE = "_KNOT_DEBUGGER_IS_WINDOW_VISIBLE"
    var debugInfo = {};
    var filter = null;
    var knotDebugger = {
        start: function(){
            this.infoDiv= parseToElement( '<div style="color:black; height:100%; text-wrap:none; overflow:scroll; z-index: 9999999"><div><span>filter:</span><input type="text"/></div><div></div></div>');
            this.filterText = this.infoDiv.firstChild.lastChild;
            this.contentDiv = this.infoDiv.lastChild;
            this.contentDiv.style.marginLeft = "-45px";
            this.isChanged = true;
            var that =this;
            this.filterText.onchange = function(){
                filter = that.filterText.value;
                if(filter == "")
                    filter =  null;
                that.update();
            }
            var dbgWnd = window.open("", "Knot debug window", "width=600,height=800");
            dbgWnd.onbeforeunload = function(){
                that.filterText.onchange = null;
                that.infoDiv = null;
                setCookie(COOKIE_KEY_IS_WINDOW_VISIBLE, "false", 0);
            }

            if(dbgWnd.document.body.children.length > 0){
                filter =  dbgWnd.document.body.firstChild.firstChild.lastChild.value;
                this.filterText.value = filter;
                for(var i = dbgWnd.document.body.children.length-1; i>=0; i--)
                    dbgWnd.document.body.removeChild(dbgWnd.document.body.children[i]);
            }
            dbgWnd.document.body.appendChild(this.infoDiv);

            setCookie(COOKIE_KEY_IS_WINDOW_VISIBLE, "true", 365);
            setInterval(function(){
                if(that.isChanged){
                    that.update();
                    that.isChanged = false;
                }
            }, 100);
        },

        waitForHotKey: function(){
            var that =this;
            var handler = function(evt){
                if(evt.keyCode == 75 && evt.altKey && evt.ctrlKey){
                    if(!that.infoDiv)
                        that.start();
                }
            };
            window.addEventListener("keydown", handler);
        },

        debug:function(knotInfo, valueName, status){
            var path =knotInfo.options.binding[valueName];
            //var arr = path.split("=");
            //path = arr[0];
            var fullPath;
            if(path[0] == "/"){
                fullPath = path;
            }
            else{
                fullPath = knotInfo.contextPath + "." + path;
            }

            var key = valueName;
            if(knotInfo.options.valueConverters && knotInfo.options.valueConverters[valueName]){
                key += "=>" + knotInfo.options.valueConverters[valueName];
            }
            if(knotInfo.options.validators && knotInfo.options.validators[valueName]){
                key += "=!" + knotInfo.options.validators[valueName];
            }
            if(knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]){
                key = "!" + key;
            }
            if(knotInfo.options.twoWayBinding && knotInfo.options.twoWayBinding[valueName]){
                key = "*" + key;
            }

            if(!debugInfo[fullPath])
                debugInfo[fullPath] = {};
            if(!debugInfo[fullPath][key])
                debugInfo[fullPath][key] =[]

            var isSet = false;
            for(var i= 0; i< debugInfo[fullPath][key].length; i++){
                if(debugInfo[fullPath][key][i].knotInfo == knotInfo){
                    debugInfo[fullPath][key][i].status = status;
                    debugInfo[fullPath][key][i].time = new Date();
                    isSet = true;
                }
            }
            if(!isSet){
                debugInfo[fullPath][key].push({status:status, knotInfo:knotInfo, time:new Date()})
            }

            this.isChanged = true;
        },

        update:function(){
            var arr = [];
            for(var p in debugInfo){
                if(filter){
                    if(p.indexOf(filter) < 0)
                        continue;
                }
                arr.push(p);
            }
            arr.sort();

            var divStack = [];
            for(var i = this.contentDiv.children.length-1; i>=0; i--)
                this.contentDiv.removeChild(this.contentDiv.children[i]);

            var rootDiv = this.contentDiv;
            var colors = ["#FFEEFF", "#EEFFFF"];
            var colorCount = 0;
            for(var i =0; i< arr.length; i++){
                var path = arr[i];//  arr[i].substr(0, arr[i].lastIndexOf("."));
                var parentDiv = null;

                for(var s=divStack.length-1; s>=0; s--){
                    if(path.substr(0,divStack[s].contentPath.length)==divStack[s].contentPath){
                        parentDiv = divStack[s];
                        break;
                    }
                    else{
                        divStack.splice(s,1);
                    }
                }

                if(!parentDiv){
                    parentDiv = rootDiv;
                }

                if(parentDiv.contentPath != path){
                    var dispPath = path;
                    if(parentDiv.contentPath)
                        dispPath = path.substr(parentDiv.contentPath.length+1);
                    var div = parseToElement('<div style="margin:2px 2px 2px 52px;border: 1px solid lightblue;background-color:'+ colors[colorCount++%2] +'"> <div style="background-color: #333388;color:white">' + dispPath +'</div></div>');
                    div.contentPath = path;
                    parentDiv.appendChild(div);
                    divStack.push(div);
                    parentDiv = div;
                }

                var detail = parseToElement('<div style="margin:0px 0px 0px 20px;"></div>');
                parentDiv.appendChild(detail);
                var msg = "";
                for(var valueName in debugInfo[arr[i]]){
                    var purValueName = valueName;
                    var additionalInfo = "";
                    if(valueName.indexOf("=")>0){
                       purValueName = valueName.substr(0, valueName.indexOf("="));
                       additionalInfo = valueName.substr(valueName.indexOf("="));
                    }
                    for(var n =0; n< debugInfo[arr[i]][valueName].length; n++){
                        var s = debugInfo[arr[i]][valueName][n];
                        msg += purValueName + " = [" + s.status + "]    " + additionalInfo + "   (" + getNodeDes(s.knotInfo) + " @"+ getShortTime(s.time) +")<br/>";
                    }
                }
                detail.innerHTML = msg;
            }
        }
    }

    function getNodeDes(info){
        var de = info.node.tagName;
        if(info.node.id){
            de += " id:" + info.node.id;
        }
        return de;
    }
    function getShortTime(t){
        return t.getHours() + ":"+ t.getMinutes() + ":" + t.getSeconds() + " " + t.getMilliseconds();
    }

    function getCookie(c_name)
    {
        var c_value = document.cookie;
        var c_start = c_value.indexOf(" " + c_name + "=");
        if (c_start == -1)
        {
            c_start = c_value.indexOf(c_name + "=");
        }
        if (c_start == -1)
        {
            c_value = null;
        }
        else
        {
            c_start = c_value.indexOf("=", c_start) + 1;
            var c_end = c_value.indexOf(";", c_start);
            if (c_end == -1)
            {
                c_end = c_value.length;
            }
            c_value = unescape(c_value.substring(c_start,c_end));
        }
        return c_value;
    }

    function setCookie(c_name,value,exdays)
    {
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=c_name + "=" + c_value;
    }

    var tempDiv;
    parseToElement = function (html) {
        if (!tempDiv)
            tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        var e = tempDiv.firstElementChild;
        tempDiv.removeChild(e);
        return e;
    }
    root.__registerKnotDebugger(knotDebugger);

    if(getCookie(COOKIE_KEY_IS_WINDOW_VISIBLE) == "true")
        knotDebugger.start();
    else
        knotDebugger.waitForHotKey();

    var parseToElement = function (html) {
        if (!tempDiv)
            tempDiv = document.createElement("div");
        if(window.toStaticHTML){
            html = window.toStaticHTML(html);
        }
        tempDiv.innerHTML = html;
        if (tempDiv.childElementCount > 1) {
            throw new Error("Number of element can't be more than 1!");
        }
        var e = tempDiv.firstElementChild;
        tempDiv.removeChild(e);
        return e;
    }
})(Knot);