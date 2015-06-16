/*
overwrite the methods of array to provide data change event.
Array.length is not overwritable, and it costs to much to overwrite the indexes. Therefore
I have to leave these trap activated. Need to emphasis this problem in manual.
When the array is changed in other way than these method, user must call Array.notifyChanged to
have knot.js updating the relevant knots
*/
(function(window){
    var __private = window.Knot.getPrivateScope();

    var _originalArrayMethods = {};


    function hookArrayMethod(method){
        _originalArrayMethods[method] = Array.prototype[method];
        Array.prototype[method] = function(){
            var oldLength = this.length;
            var ret = _originalArrayMethods[method].apply(this, arguments);
            if(this.__knot_attachedData){
                __private.DataObserver.notifyDataChanged(this, "*");
                if(oldLength != this.length){
                    __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length);
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
            __private.DataObserver.notifyDataChanged(this, "*");
            __private.DataObserver.notifyDataChanged(this, "length",null, this.length);
        }
    }

})((function() {
        return this;
    })());