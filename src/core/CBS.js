(function(){
    var __private = Knot.getPrivateScope();


    /////////////////////////////////
    //CBS handling.
    //It loads CBS settings from CBS files/blocks
    //then put the setting to __knot_cbs_options of the relevant topic node
    ////////////////////////////////
    __private.CBS = {
        removeComments: function(text){
            if(!text || text == "")
                return null;
            var pos;
            while((pos = text.indexOf("/*")) >= 0){
                var np = text.indexOf("*/", pos);
                if(np < 0){
                    throw new Error("Can't find close mark for comment.");
                }
                text = text.substr(0, pos) +text.substr(np + 2);
            }

            var lines = text.split("\n");
            var res = "";
            for(var i = 0; i< lines.length; i++){
                var sl = lines[i].split("\r");
                for(var j= 0; j < sl.length; j++){
                    if(__private.Utility.trim(sl[j]).substr(0, 2) == "//"){
                        continue;
                    }
                    res += sl[j];
                }
            }
            return res;
        },

        cbsInit: function(onFinish, onError){
            var blocks = document.querySelectorAll("script");
            var scriptToLoad = 0;
            var check = function(){
                if(scriptToLoad == 0 && onFinish)
                    onFinish();
            }
            var that =this;
            for(var i =0; i< blocks.length; i++){
                if(blocks[i].type == "text/cbs"){
                    if(blocks[i].src){
                        scriptToLoad ++;
                        (function(){
                            var src = blocks[i].src;
                            var hr = __private.Utility.getXHRS();
                            hr.onreadystatechange = function(){
                                if(hr.readyState == 4){
                                    if(hr.status == 200){
                                        try{
                                            that.applyCBS(hr.responseText);
                                            scriptToLoad--;
                                            check();
                                        }
                                        catch(err){
                                            if(onError) onError("Load CBS script error. url:" + src + " message:"  + err.message)
                                        }
                                    }
                                    else{
                                        if(onError) onError("Load CBS script error. url:" + src + " message:" +hr.statusText);
                                    }
                                }
                            }
                            hr.open("GET", src, true);
                            hr.send();
                        })();
                    }
                    else{
                        try{
                            this.applyCBS(this.removeComments(blocks[i].textContent));
                        }
                        catch(err){
                            if(onError) onError("Load CBS block error. " + err.message);
                        }
                    }
                }
            }

            check();
        },
        applyCBS: function(cbs){
            if(!cbs || cbs == "")
                return;
            var parsePos = 0;
            cbs = cbs.replace(/\r/g," ").replace(/\n/g, " ");
            cbs = __private.OptionParser.processEmbeddedFunction(cbs);
            while(true){
                var block = __private.Utility.getBlockInfo(cbs, parsePos, "{", "}");
                if(!block)
                    return;

                var options = __private.Utility.trim(cbs.substr(block.start+1, block.end-block.start-1));
                options = options.replace(/;/g, ",");
                if(options[options.length-1] == ",")
                    options = options.substr(0, options.length-1);

                var selector = __private.Utility.trim(cbs.substr(parsePos, block.start-parsePos));
                var seq = -1;
                if(selector[selector.lastIndexOf("[")-1] == " "){
                    if(selector[selector.length-1] != "]"){
                        throw new Error("Unknown cbs selector " + selector);
                    }
                    seq = Number(selector.substr(selector.lastIndexOf("[")+1, selector.length - selector.lastIndexOf("[")-2));
                    if(isNaN(seq)){
                        throw new Error("Unknown cbs selector " + selector);
                    }

                    selector = selector.substr(0, selector.lastIndexOf("["));
                }
                try{
                    var elements = document.querySelectorAll(selector);
                }
                catch(err){
                    throw new Error("Query selector failed. selector:" + selector + " message:" + err.message);
                }
                if(elements.length == 0)
                    throw new Error("No element matches the selector:" + selector);
                if(seq>=0){
                    if(elements[seq])
                        elements[seq].__knot_cbs_options = (elements[seq].__knot_cbs_options?(elements[seq].__knot_cbs_options+";"+  options) :options);
                    else
                        throw new Error("No element exists at this index. selector:" + selector);
                }
                else{
                    for(var i= 0; i< elements.length; i++){
                        elements[i].__knot_cbs_options = (elements[i].__knot_cbs_options?(elements[i].__knot_cbs_options+";"+  options) :options)
                    }
                }

                parsePos = block.end +1;
            }
        }
    }

})();