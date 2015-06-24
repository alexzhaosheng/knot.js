/*
    Deferred
    This is simplified Deferred object for asynchronous validating and initialization.
*/

(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    __private.Deferred = function () {
        this._succCallbacks = [];
        this._errCallbacks = [];
        this.isFinished = false;
        this.isRejected = false;
        this.result = null;
    };
    __private.Deferred.prototype.resolve = function (result) {
        this.result = result;
        this.isFinished = true;
        this.isRejected = false;
        for(var i= 0; i< this._succCallbacks.length; i++) {
            this._succCallbacks[i](result);
        }
    };
    __private.Deferred.prototype.reject = function (error) {
        this.result = error;
        this.isFinished = true;
        this.isRejected = true;
        for(var i= 0; i< this._errCallbacks.length; i++) {
            this._errCallbacks[i](error);
        }
    };
    __private.Deferred.prototype.done = function (succCallback, errorCallback) {
        if(this.isFinished) {
            if(this.isRejected) {
                errorCallback(this.result);
            }
            else {
                succCallback(this.result);
            }
        }
        else{
            this._succCallbacks.push(succCallback);
            this._errCallbacks.push(errorCallback);
        }
        return this;
    };

})(window);