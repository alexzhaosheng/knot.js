/////////////////////////////////////
//Deffered
//This is simplified Deffered object for asynchronous validating and initialization.
/////////////////////////////////////

(function(){
    var __private = Knot.getPrivateScope();

    __private.Deffered = function(){
        this._succCallbacks = [];
        this._errCallbacks = [];
    }
    __private.Deffered.prototype.resolve = function(result){
        for(var i= 0; i< this._succCallbacks.length; i++)
            this._succCallbacks[i](result);
    }
    __private.Deffered.prototype.reject = function(error){
        for(var i= 0; i< this._errCallbacks.length; i++)
            this._errCallbacks[i](error);
    }
    __private.Deffered.prototype.done = function(succCallback, errorCallback){
        this._succCallbacks.push(succCallback);
        this._errCallbacks.push(errorCallback);
        return this;
    }

})();