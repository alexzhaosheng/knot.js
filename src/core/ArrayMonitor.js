/*
    overwrite the methods of array to provide data change event.
    Array.length is not overwritable, and it costs to much to overwrite the indexes. Therefore
    I have to leave these trap activated. Need to emphasis this problem in manual.
    When the array is changed in other way than these method, user must call Array.notifyChanged to
    have knot.js updating the relevant knots
*/
(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    var _originalArrayMethods = {};


    function hookArrayMethod(method) {
        _originalArrayMethods[method] = Array.prototype[method];
        Array.prototype[method] = function () {
            var oldLength = this.length;
            var ret = _originalArrayMethods[method].apply(this, arguments);
            if(this.__knot_attachedData) {
                __private.DataObserver.notifyDataChanged(this, "*");
                if(oldLength !== this.length) {
                    __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length);
                }
            }
            return ret;
        };
    }


    hookArrayMethod("sort");
    hookArrayMethod("reverse");

    var _arrayVersion = 0;
    function increaseArrayVersion(array){
        array.__knot_arrayVersion = _arrayVersion++;

        if(!isFinite(_arrayVersion)) {
            _arrayVersion = 0;
        }
    }

    Array.prototype.notifyChanged = function (removedIndexes, addedIndexes) {
        if(this.__knot_attachedData) {
            var arrayChangedInfo = null;
            if(removedIndexes && addedIndexes){
                arrayChangedInfo =  {removed:removedIndexes, added:addedIndexes};
            }
            __private.DataObserver.notifyDataChanged(this, "*", arrayChangedInfo);
            __private.DataObserver.notifyDataChanged(this, "length", null, this.length, {property:"length"});
        }
    };

    Array.prototype.setValueAt = function(index, value){
        this[index] = value;
        if(this.__knot_attachedData) {
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:[index], added:[index]});
        }
    };
    Array.prototype.clear = function(){
        this.splice(0, this.length);
    };


    _originalArrayMethods.push = Array.prototype.push;
    Array.prototype.push = function () {
        var oldLength = this.length;
        var ret = _originalArrayMethods.push.apply(this, arguments);
        if(this.__knot_attachedData) {
            var added = [];
            for(var i=0; i<arguments.length;i++){
                added.push(oldLength + i);
            }
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:[], added:added});
            __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length, {property:"length"});
        }
        return ret;
    };
    _originalArrayMethods.unshift = Array.prototype.unshift;
    Array.prototype.unshift = function () {
        var oldLength = this.length;
        var ret = _originalArrayMethods.unshift.apply(this, arguments);
        if(this.__knot_attachedData) {
            var added = [];
            for(var i=0; i<arguments.length;i++){
                added.push(i);
            }
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:[], added:added});
            __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length, {property:"length"});
        }
        return ret;
    };

    _originalArrayMethods.pop = Array.prototype.pop;
    Array.prototype.pop = function () {
        var oldLength = this.length;
        var ret = _originalArrayMethods.pop.apply(this, arguments);
        if(this.__knot_attachedData) {
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:[oldLength-1], added:[]});
            __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length, {property:"length"});
        }
        return ret;
    };
    _originalArrayMethods.shift = Array.prototype.shift;
    Array.prototype.shift = function () {
        var oldLength = this.length;
        var ret = _originalArrayMethods.shift.apply(this, arguments);
        if(this.__knot_attachedData) {
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:[0], added:[]});
            __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length, {property:"length"});
        }
        return ret;
    };

    _originalArrayMethods.splice = Array.prototype.splice;
    Array.prototype.splice = function (start, deleteCount) {
        var oldLength = this.length;
        var ret = _originalArrayMethods.splice.apply(this, arguments);
        if(this.__knot_attachedData) {
            var added = [], removed = [];
            for(var i=start; i<start+deleteCount; i++){
                removed.push(i);
            }
            for(i=start; i<start+arguments.length-2; i++){
                added.push(i);
            }
            increaseArrayVersion(this);
            __private.DataObserver.notifyDataChanged(this, "*", null, null, {removed:removed, added:added});
            __private.DataObserver.notifyDataChanged(this, "length", oldLength, this.length, {property:"length"});
        }
        return ret;
    };
})(window);