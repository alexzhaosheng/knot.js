/*
    Helpers and utilities
* */
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    var _blockStartMarks= {"(":true, "{":true, "[":true};
    var _blockEndMarks= {")":true, "}":true, "]":true};
    var _blockPairs = {"(":")", "{":"}", "[":"]"};

    /////////////////////////////////////
    // Utility functions
    /////////////////////////////////////
    __private.Utility = {
        //test whether the object is an empty object (no any properties)
        isEmptyObj: function (obj) {
            var p;
            for (p in obj) {
                return false;
            }
            return true;
        },

        trim: function (s) {
            if (s.trim) {
                return s.trim();
            }
            return s.replace(/^\s+|\s+$/g, "");
        },

        startsWith: function (s, startStr) {
            if(!s){
                return false;
            }
            return s.substr(0, startStr.length) === startStr;
        },

        //get the value on data by the path
        getValueOnPath: function (rootData, path) {
            if((!path && path !== "") || (path === "*NULL")) {
                return null;
            }
            //if path is "*", return the data it-self
            if(path === "*" || path === "") {
                return rootData;
            }

            var isFunction = false;
            if(path[0] === "@") {
                isFunction = true;
                path = path.substr(1);
            }

            var res;
            if (this.startsWith(path, "__knot_global")) {
                res =  __private.GlobalSymbolHelper.getSymbol(path);
            }
            else {
                var data = rootData;
                if(path[0] === "/") {
                    data= global;
                    path = path.substr(1);
                }
                while (path.indexOf(".") >= 0 && data) {
                    var p = __private.Utility.trim(path.substr(0, path.indexOf(".")));
                    if(p !== "*") {
                        data = data[p];
                    }
                    else{
                        data = undefined;
                    }
                    path = __private.Utility.trim(path.substr(path.indexOf(".") + 1));
                }
                if(path === "*") {
                    res = data;
                }
                else if (data) {
                    res= data[path];
                }
            }
            if(isFunction && res && typeof(res) !== "function") {
                __private.Log.error("'"+ path +"' is expected as a function, but it isn't.");
                return undefined;
            }
            return res;
        },

        //set value on path for data
        setValueOnPath: function (data, path, value) {
            //never set value for *
            if(path[path.length-1] === "*"){
                return;
            }
            if(this.startsWith(path,"__knot_global")) {
                throw new Error("Can't set global symbol!");
            }
            if(path && path[0] === "/") {
                data = global;
                path = path.substr(1);
            }

            var vp = path;
            var p = path.lastIndexOf(".");
            if(p > 0) {
                vp = path.substr(p+1);
                data = this.getValueOnPath(data, path.substr(0, p));
            }
            if(data){
                data[vp] = value;
            }
        },

        //get XMLHttpRequest object.
        getXHRS: function () {
            if (global.XMLHttpRequest) {
                return new XMLHttpRequest();
            }
            else{
                return new ActiveXObject("Microsoft.XMLHTTP");
            }
        },


        //get the whole block information that between startMark and endMark
        //it pairs the startMark and endMark support the embedded internal blocks
        getBlockInfo: function (str, startIndex, startMark, endMark) {
            var info = {start:-1, end:-1};
            info.start = str.indexOf(startMark, startIndex);
            if(info.start<0){
                return null;
            }

            var ct = 0;
            var pos = info.start+1;
            while(true) {
                var ns = str.indexOf(startMark, pos);
                var ne = str.indexOf(endMark, pos);
                if(ne < 0){
                    break;
                }
                if(ns<0 || ne < ns) {
                    if(ct === 0) {
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
            if(info.start >=0 && info.end>=0) {
                return info;
            }
            else{
                return null;
            }
        },

        //split string with block check
        //here "blocks" are those texts enclosed by "(,),[,],{,}"
        splitWithBlockCheck: function (str, splitter) {
            var pos = 0, prev=0;
            var res = [];

            var blockStack = [];

            while(pos < str.length) {
                if(_blockStartMarks[str[pos]]){
                    blockStack.push(str[pos]);
                }
                else if(_blockEndMarks[str[pos]]){
                    var b = blockStack.pop();
                    if(_blockPairs[b] !== str[pos]){
                        __private.log.warning("Unclosed block is detected.\r" + str);
                        blockStack.push(b);
                    }
                }
                else if(str[pos] === splitter && blockStack.length === 0){
                    res.push(str.substr(prev, pos-prev));
                    prev = pos+1;
                }
                pos++;
            }

            if(blockStack.length > 0){
                __private.log.warning("Unclosed block is detected.\r" + str);
            }

            if(pos >= prev){
                res.push(str.substr(prev, pos-prev));
            }
            return res;
        }
    };

})(window);