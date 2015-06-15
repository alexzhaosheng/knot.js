(function(window){
    var __private = window.Knot.getPrivateScope();

    /////////////////////////////////////
    // Utility functions
    /////////////////////////////////////
    __private.Utility ={
        //test whether the object is an empty object (no any properties)
        isEmptyObj: function(obj) {
            for (var p in obj) {
                return false;
            }
            return true;
        },

        trim: function (s) {
            if(s.trim)
                return s.trim();
            return s.replace(/^\s+|\s+$/g, "");
        },

        startsWith:function(s, startStr){
            return s.substr(0, startStr.length) == startStr;
        },

        getValueOnPath: function(rootData, path) {
            if(path == "*NULL")
                return null;
            if(path == "*" || path =="")
                return rootData;

            var isFunction = false;
            if(path[0] == "@"){
                isFunction = true;
                path = path.substr(1);
            }

            var res;
            if(this.startsWith(path,"__knot_global")){
                res =  __private.GlobalSymbolHelper.getSymbol(path);
            }
            else{
                var data = rootData;
                if(path[0] == "/"){
                    data= window;
                    path = path.substr(1);
                }
                while (path.indexOf(".") >= 0 && data) {
                    data = data[path.substr(0, path.indexOf("."))];
                    path = path.substr(path.indexOf(".") + 1);
                }
                if (data)
                    res= data[path];
            }
            if(isFunction && typeof(res) != "function"){
                    __private.Log.error("'"+ path +"' is expected as a function, but it isn't.");
                    return undefined;
            }
            return res;
        },

        setValueOnPath: function(data, path, value){
            if(this.startsWith(path,"__knot_global")){
                throw new Error("Can't set global symbol!");
            }
            var vp = path;
            var p = path.lastIndexOf(".");
            if(p > 0){
                vp = path.substr(p+1);
                data = this.getValueOnPath(data, path.substr(0, p));
            }
            if(data)
                data[vp] = value;
        },


        getXHRS: function(){
            if (window.XMLHttpRequest){
                return new XMLHttpRequest();
            }
            else{
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
        },


        getBlockInfo: function(str, startIndex, startMark, endMark){
            var info = {start:-1, end:-1};
            info.start = str.indexOf(startMark, startIndex);
            if(info.start<0)
                return null;

            var ct = 0;
            var pos = info.start+1;
            while(true){
                var ns = str.indexOf(startMark, pos);
                var ne = str.indexOf(endMark, pos);
                if(ne<0)
                    break;
                if(ns<0 || ne < ns){
                    if(ct==0){
                        info.end = ne;
                        break;
                    }
                    else{
                        ct--;
                    }
                    pos = ne+1;
                }
                else{
                    ct++;
                    pos = ns+1;
                }
            }
            if(info.start >=0 && info.end>=0)
                return info;
            else{
                return null;
            }
        },

        //actual_apName[optionName:option,optionName2:option2...]
        parseInAPNameDefinition: function(apName){
            var res = {apName:null, options:[]}
            var block = this.getBlockInfo(apName, 0, "[", "]");
            if(block){
                res.apName = apName;
            }
            else{
                var options = apName.substr(block.start+1, block.end-block.start-1);
                options = options.split(",")
                for(var i=0;i<options.length;i++){
                  //  var o = options[i].split(:)
                }
            }
        },

        splitWithBlockCheck: function(str, splitorChar){
            var pos = 0; prev=0;
            var res = [];
            var bracketCount =0;
            var squreBracketCount =0;
            while(pos < str.length){
                switch (str[pos]){
                    case "(":
                        bracketCount++; break;
                    case ")":
                        bracketCount = Math.max(0, bracketCount-1); break;
                    case "[":
                        squreBracketCount++;break;
                    case "]":
                        squreBracketCount=Math.max(0, squreBracketCount-1); break;
                    case splitorChar:
                        if(bracketCount ==0 && squreBracketCount==0){
                            res.push(str.substr(prev, pos-prev));
                            prev = pos+1;
                        }
                        break;
                    default :
                        break;
                }
                pos++;
            }

            if(pos >= prev)
                res.push(str.substr(prev, pos-prev));
            return res;
        }
    }
})((function() {
        return this;
    })());