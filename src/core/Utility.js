(function () {
    var __private = Knot.getPrivateScope();

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


        getValueOnPath: function(rootData, path) {
            if(path == "*NULL")
                return null;
            if(path == "*" || path =="")
                return rootData;

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
                return data[path];
            return undefined;
        },

        setValueOnPath: function(data, path, value){
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
        }
    }
})();