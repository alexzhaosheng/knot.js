/////////////////////////////////////
//Deferred
//This is simplified Deferred object for asynchronous validating and initialization.
/////////////////////////////////////

(function(){
    var __private = Knot.getPrivateScope();

    __private.Deferred = function(){
        this._succCallbacks = [];
        this._errCallbacks = [];
    }
    __private.Deferred.prototype.resolve = function(result){
        for(var i= 0; i< this._succCallbacks.length; i++)
            this._succCallbacks[i](result);
    }
    __private.Deferred.prototype.reject = function(error){
        for(var i= 0; i< this._errCallbacks.length; i++)
            this._errCallbacks[i](error);
    }
    __private.Deferred.prototype.done = function(succCallback, errorCallback){
        this._succCallbacks.push(succCallback);
        this._errCallbacks.push(errorCallback);
        return this;
    }

})();