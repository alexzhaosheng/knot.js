///////////////////////////////////////////////////////
// Parse options
///////////////////////////////////////////////////////
/*
 *Splitor
 ":"

 *access point (AP)
 *   - 2 APs make up a knot. like this: AP1:AP2
     - The way it is interpreted depends on the target and the AP name
     - Multiple APs can be composed in to one withe a n to 1 pipe

 *pipe
     1 to 1
     n to 1
     can be a inline code segment marked by {}. it always use variant name "value" to access the inputed value and always return an output. it can access the attached AP by using "this"

 *type descriptor for attached APs
     nothing special: data
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
(function(window){
    var __private = window.Knot.getPrivateScope();


    function createEmbeddedFunction(text){
        var func = "(function(value){" + text + "})";
        try{
            var newName = __private.GlobalSymbolHelper.registerSymbol(eval(func))
        }
        catch (ex){
            __private.Log.error("Invalid pipe function: \r\n"+ func, ex);
        }

        return newName;
    }


    __private.OptionParser = {

        parse: function(optionText) {
            var options = [];

            optionText = this.processEmbeddedFunctions(optionText);
            var sections = __private.Utility.splitWithBlockCheck(optionText, ";");

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
                var registeredName = createEmbeddedFunction(funcText);
                text = text.substr(0, blockInfo.start) + registeredName + text.substr(blockInfo.end+1);
                blockInfo = __private.Utility.getBlockInfo(text, 0, "{", "}");
            }
            return text;
        },

        parseKnot: function(text){
            text = __private.Utility.trim(text);
            if(!text)
                return null;

            var parts = __private.Utility.splitWithBlockCheck(text, ":");
            if(parts.length != 2){
                __private.Log.error("Invalid option:"+text);
                return null;
            }

            var left = this.parseAccessPoint(parts[0])
            var right = this.parseAccessPoint(parts[1]);
            if(left == null || right == null || (left.isComposite && right.isComposite)){
                __private.Log.error("Invalid option:"+text);
                return null;
            }

            return {leftAP:left, rightAP:right};
        },

        parseAccessPoint: function(text){
            text = __private.Utility.trim(text);
            if(text[0] == "("){
                return this.parseCompositeAP(text);
            }
            var parts =  __private.Utility.splitWithBlockCheck(text, ">");
            var AP = __private.Utility.trim(parts[0]);
            parts.splice(0, 1);
            var pipes = parts.map(function(t){return __private.Utility.trim(t)});
            if(__private.GlobalSymbolHelper.isGlobalSymbol(AP)){
                pipes.splice(0,0,AP);
                AP = "*";
            }
            return {description:AP, pipes:pipes};
        },

        parseCompositeAP: function(text){
            var block = __private.Utility.getBlockInfo(text, 0, "(", ")");
            if(!block){
                __private.Log.error("Invalid composite option:"+text);
                return null;
            }
            var aPParts = __private.Utility.splitWithBlockCheck(text.substr(block.start+1, block.end - block.start-1),"&");
            var aPs = [];
            for(var i=0 ;i < aPParts.length; i++){
                var ap = this.parseAccessPoint(aPParts[i]);
                if(ap == null){
                    return null;
                }
                aPs.push(ap);
            }

            var pipleStart = block.end + 1;
            while(text[pipleStart]!=">"){
                if(text[pipleStart] != " " && text[pipleStart] != "\t" && text[pipleStart] != "\a" && text[pipleStart] != "\n")
                {
                    __private.Log.error("Invalid composite option:"+text);
                    return null;
                }
                pipleStart++;
            }
            pipleStart++;
            var nToOnePiple = __private.Utility.trim(text.substr(pipleStart));
            if(!nToOnePiple){
                __private.Log.error("Invalid composite option:"+text);
                return null;
            }
            return {isComposite:true, childrenAPs:aPs, nToOnePipe:nToOnePiple};
        }
    }
})((function() {
        return this;
    })());