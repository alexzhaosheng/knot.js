/*
   Parse the knot options.
   Note "knot options" is not CBS options, CBS options is parsed in HTMLKnotBuilder and the knot options in CBS options
   are extracted then are parsed with OptionParser

 */
(function (global) {
    "use strict";

    var __private = global.Knot.getPrivateScope();


    //create embedded functions with the text
    //embedded functions are registered to Global Symbol
    function createEmbeddedFunction(text) {
        //embedded functions always has a parameter named "value"
        var func = "(function (value) {" + text + "})";
        try{
            return  __private.GlobalSymbolHelper.registerSymbol(eval(func));
        }
        catch (ex) {
            __private.Log.error("Invalid pipe function: \r\n"+ func, ex);
        }
        return undefined;
    }


    __private.OptionParser = {
        //parse options
        parse: function (optionText) {
            var options = [];

            optionText = this.processEmbeddedFunctions(optionText);
            var sections = __private.Utility.splitWithBlockCheck(optionText, ";");

            for(var i=0; i<sections.length; i++) {
                var knot = this.parseKnot(sections[i]);
                if(!knot) {
                    continue;
                }
                options.push(knot);
            }
            return options;
        },

        //extract the embedded function texts and create embedded function, replace the function text with the name of
        // the created function
        processEmbeddedFunctions: function (text) {
            var blockInfo = __private.Utility.getBlockInfo(text, 0, "{", "}");
            while(blockInfo) {
                var funcText = text.substr(blockInfo.start+1, blockInfo.end - blockInfo.start - 1);
                var registeredName = createEmbeddedFunction(funcText);
                text = text.substr(0, blockInfo.start) + registeredName + text.substr(blockInfo.end+1);
                blockInfo = __private.Utility.getBlockInfo(text, 0, "{", "}");
            }
            return text;
        },

        //parse a knot option
        parseKnot: function (text) {
            text = __private.Utility.trim(text);
            if(!text) {
                return null;
            }

            var parts = __private.Utility.splitWithBlockCheck(text, ":");
            if(parts.length !== 2) {
                __private.Log.error("Invalid option:"+text);
                return null;
            }

            var left = this.parseAccessPoint(parts[0]);
            var right = this.parseAccessPoint(parts[1]);
            if(left === null || right === null || (left.isComposite && right.isComposite)) {
                __private.Log.error("Invalid option:"+text);
                return null;
            }

            return {leftAP:left, rightAP:right};
        },

        //parse an access point definition
        parseAccessPoint: function (text) {
            text = __private.Utility.trim(text);
            if(text[0] === "(") {
                return this.parseCompositeAP(text);
            }
            var parts =  __private.Utility.splitWithBlockCheck(text, ">");
            var AP = __private.Utility.trim(parts[0]);
            parts.splice(0, 1);
            var pipes = parts.map(function (t) {return __private.Utility.trim(t);});
            var options = null;
            if(AP[AP.length-1] === "]") {
                var optionBlock = __private.Utility.getBlockInfo(AP, 0, "[", "]");
                if(optionBlock) {
                    options = this.getAPOptions(AP.substr(optionBlock.start+1, optionBlock.end-optionBlock.start-1));
                    AP = AP.substr(0, optionBlock.start);
                }

            }
            return {description:AP, pipes:pipes, options:options};
        },

        //parse the options on access point
        getAPOptions: function (optionStr) {
            var options = {};
            var arr = __private.Utility.splitWithBlockCheck(optionStr, ";");
            for(var i=0; i< arr.length; i++) {
                var kv = arr[i].split(":");
                if(kv.length !== 2 || !kv[0] ||  !kv[1]) {
                    __private.Log.error("Invalid AP option:" + arr[i]);
                }
                else{
                    options[__private.Utility.trim(kv[0])] = __private.Utility.trim(kv[1]);
                }
            }
            return options;
        },

        //parse composite AP
        parseCompositeAP: function (text) {
            var block = __private.Utility.getBlockInfo(text, 0, "(", ")");
            if(!block) {
                __private.Log.error("Invalid composite option:"+text);
                return null;
            }
            var aPParts = __private.Utility.splitWithBlockCheck(text.substr(block.start+1, block.end - block.start-1),"&");
            var aPs = [];
            for(var i=0 ;i < aPParts.length; i++) {
                var ap = this.parseAccessPoint(aPParts[i]);
                if(!ap) {
                    return null;
                }
                aPs.push(ap);
            }

            var pipeStart = block.end + 1;
            while(text[pipeStart]!==">") {
                if(text[pipeStart] !== " " && text[pipeStart] !== "\t" && text[pipeStart] !== "\n")
                {
                    __private.Log.error("Invalid composite option:"+text);
                    return null;
                }
                pipeStart++;
            }
            pipeStart++;
            var nToOnePiple = __private.Utility.trim(text.substr(pipeStart));
            if(!nToOnePiple) {
                __private.Log.error("Invalid composite option:"+text);
                return null;
            }
            return {isComposite:true, childrenAPs:aPs, nToOnePipe:nToOnePiple};
        }
    };
})(window);