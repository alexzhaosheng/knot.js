(function(){
    var __private = Knot.getPrivateScope();

    function removeComments(text){
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
    }

    __private.HTMLKnotManager = {
        normalizedCBS:[],
        parseCBS:function(){
            var deferred = new __private.Deferred();
            var blocks = document.querySelectorAll("script");
            var that =this;
            var scriptToLoad = 0;

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
                                            var text = removeComments(hr.responseText);
                                            that.normalizeCBS(text);
                                            scriptToLoad--;
                                            if(scriptToLoad == 0)
                                                deferred.resolve();
                                        }
                                        catch(err){
                                            __private.Log.error(__private.Log.Source.Knot, "Load CBS script error. url:" + src + " message:" + err.message, err);
                                            deferred.reject(err);
                                        }
                                    }
                                    else{
                                        __private.Log.error(__private.Log.Source.Knot, "Load CBS script error. url:" + src + " message:" +hr.statusText);
                                        deferred.reject(new Error( "Load CBS script error. url:" + src + " message:" +hr.statusText));
                                    }
                                }
                            }
                            hr.open("GET", src, true);
                            hr.send();
                        })();
                    }
                    else{
                        var text = removeComments(blocks[i].textContent);
                        this.normalizeCBS(text);
                    }
                }
            }
            if(scriptToLoad > 0)
                return deferred;
        },

        normalizeCBS: function(text){
            var pos = 0;
            var blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            while(blockInfo != null){
                var selector = text.substr(pos, blockInfo.start-pos);
                selector = __private.Utility.trim(selector);
                if(!this.normalizedCBS[selector])
                    this.normalizedCBS[selector] = [];

                var options = text.substr(blockInfo.start+1,  blockInfo.end - blockInfo.start - 1);
                options = __private.OptionParser.processEmbeddedFunctions(options);
                var opArray = options.split(";");

                for(var i=0; i< opArray.length; i++){
                    var option = __private.Utility.trim(opArray[i]);
                    if(this.normalizedCBS[selector].indexOf(option) < 0)
                        this.normalizedCBS[selector].push(option);
                }

                pos = blockInfo.end + 1;
                blockInfo = __private.Utility.getBlockInfo(text, pos, "{", "}");
            }
        },

        applyCBS: function(){
            for(var selector in this.normalizedCBS){
                var elements = document.querySelectorAll(selector);
                var cbsOptions = this.normalizedCBS[selector];
                for(var i=0; i<elements.length; i++){
                    if(!elements[i].__knot_options){
                        elements[i].__knot_options = [];
                    }
                    if(elements[i].attributes["binding"] &&  elements[i].attributes["binding"].value){
                        var embeddedOptions = elements[i].attributes["binding"].value;
                        embeddedOptions = __private.OptionParser.processEmbeddedFunctions(embeddedOptions);
                        embeddedOptions = embeddedOptions.split(";").map(function(t){return __private.Utility.trim(t);});
                        cbsOptions = cbsOptions.concat(embeddedOptions);
                    }
                    for(var j=0; j<cbsOptions.length; j++){
                        if(!elements[i].__knot_options[cbsOptions[j]]){
                            //each item of "cbsOptions" only contains the option for one knot
                            var parsedOption = __private.OptionParser.parse(cbsOptions[j]);
                            if(parsedOption.length == 1){
                                elements[i].__knot_options[cbsOptions[j]] = parsedOption[0];
                            }
                        }
                    }
                }
            }
        }
    }
})();