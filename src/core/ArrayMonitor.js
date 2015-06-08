(function(){
    var __private = Knot.getPrivateScope();

    var _originalArrayMethods = {};


    function hookArrayMethod(method){
        _originalArrayMethods[method] = Array.prototype[method];
        Array.prototype[method] = function(){
            var oldLength = this.length;
            var ret = _originalArrayMethods[method].apply(this, arguments);
            if(this.__knot_attachedData){
                __private.DataMonitor.notifyDataChanged(this, "*");
                if(oldLength != this.length){
                    __private.DataMonitor.notifyDataChanged(this, "length", oldLength, this.length);
                }
            }
            return ret;
        }
    }


    hookArrayMethod("push");
    hookArrayMethod("pop");
    hookArrayMethod("unshift");
    hookArrayMethod("shift");
    hookArrayMethod("splice");
    hookArrayMethod("sort");
    hookArrayMethod("reverse");

    Array.prototype.notifyChanged = function(){
        if(this.__knot_attachedData){
            __private.DataMonitor.notifyDataChanged(this, "*");
            __private.DataMonitor.notifyDataChanged(this, "length",null, this.length);
        }
    }

})();