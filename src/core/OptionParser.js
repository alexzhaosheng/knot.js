///////////////////////////////////////////////////////
// Parse options
///////////////////////////////////////////////////////
/*
 *Splitor
 ":"

 *access point (AP)
     - html element AP, on the left of Splitor. The way it is interpreted depends on the html element and the AP name
     - attached AP, on the right, can be data or  html element+html element AP
     - only 1 AP allowed on the left, this AP is on the element selected by selector
     - if there's multiple APs on the right, they must be connected with a n to 1 pipe

 *pipe
     1 to 1
     n to 1
     can be a inline code segment marked by {}. it always use variant name "value" to access the inputed value and always return an output. it can access the attached AP by using "this"

 *type descriptor for attached APs
     nothing: data
     "#":html element, followed by the element AP descriptor
     "( & )>": composite AP. Made of multiple APs (can followed by pipe) that are included in "()" and connected by &. Their output is to be merged by a n to 1 pipe that follows >

*******Examples*******

 //decode password in authentication.password and set to text
 //when text is changed, validate it by validatePassword and encode password then set it to authentication.password
 #passwordInput{authentication.password then
    text >validatePassword>encodePassword: authentication.password>@decodePassword
 }

 //when regOption's selectedIndex is great than 2, then enable emailInput, other wise disable
 #emailInput{
    isEnabled: #regOption.selectedIndex>{return value>2?true:false;}
 }

 //when isLogged and userId >0, textInput is enabled.
 #textInput{
    isEnabled: (isLogged & userId>trueWhenNot0 )>trueWhenAllTrue
 }

 */
(function(){
    var __private = Knot.getPrivateScope();

    __private.EmbeddedFunctions = {};

    var _dynamicFuncNumber = 0;
    function createDynamicPipeFunction(text){
        var newName = "f_" + (_dynamicFuncNumber++);
        var func = "(function(value){" + text + "})";
        try{
            __private.EmbeddedFunctions[newName] = eval(func);
        }
        catch (ex){
            __private.Log.error(__private.Log.Source.Knot,"Invalid pipe function: \r\n"+ func, ex);
        }

        return "__knot." + newName;
    }

    __private.OptionParser = {

        parse: function(optionText) {
            var options = [];

            optionText = this.processEmbeddedFunctions(optionText);
            var sections = optionText.split(";");

            for(var i=0; i<sections.length; i++){
                var knot = this.parseKnot(sections[i]);
                if(knot)
                    options.push(knot);
            }
            return options;
        },

        processEmbeddedFunctions: function(text){
            var blockInfo = __private.Utility.getBlockInfo(text, 0, "{", "}");
            while(blockInfo){
                var funcText = text.substr(blockInfo.start+1, blockInfo.end - blockInfo.start - 1);
                var registeredName = createDynamicPipeFunction(funcText);
                text = text.substr(0, blockInfo.start) + registeredName + text.substr(blockInfo.end+1);
                blockInfo = __private.Utility.getBlockInfo(text, 0, "{", "}");
            }
            return text;
        },

        parseKnot: function(text){
            text = __private.Utility.trim(text);
            if(!text)
                return null;

            var parts = text.split(":");
            if(parts.length != 2){
                __private.Log.error(__private.Log.Source.Knot,"Unknown option:"+text);
                return null;
            }

            var left = this.parseAccessPoint(parts[0])
            var right = this.parseAccessPoint(parts[1]);
            if(left == null || right == null){
                __private.Log.error(__private.Log.Source.Knot,"Unknown option:"+text);
                return null;
            }

            return {elementAP:left, attachedAP:right};
        },

        parseAccessPoint: function(text){
            text = __private.Utility.trim(text);
            if(text[0] == "("){
                return this.parseCompositeAP(text);
            }
            var parts = text.split(">");
            var AP = __private.Utility.trim(parts[0]);
            parts.splice(0, 1);
            var pipes = parts.map(function(t){return __private.Utility.trim(t)});
            return {AP:AP, pipes:pipes};
        },

        parseCompositeAP: function(text){
            var block = __private.Utility.getBlockInfo(text, 0, "(", ")");
            if(!block){
                __private.Log.error(__private.Log.Source.Knot,"Unknown composite option:"+text);
                return null;
            }
            var aPParts = text.substr(block.start+1, block.end - block.start-1).split("&");
            var aPs = [];
            for(var i=0 ;i < aPParts.length; i++){
                var ap = this.parseAccessPoint(aPParts[i]);
                if(ap == null){
                    return null;
                }
                aPs.push(ap);
            }

            var nToOnePiple = __private.Utility.trim(text.substr(block.end +2));
            if(!nToOnePiple){
                __private.Log.error(__private.Log.Source.Knot,"Unknown composite option:"+text);
                return null;
            }
            return {isCompositeAP:true, APs:aPs, nToOnePipe:nToOnePiple};
        }
    }
})();