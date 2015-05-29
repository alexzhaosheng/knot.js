/*
    accessPointerProvider:
        an object which provide the ability of setting value/getting value/eventChange for specified
        access point on html element/data

    this is the interface of access point provider:
    {
        doesSupport:function(target, accessPointName);  //required. return true if the access point on the target is supported
        getValue:function(target, accessPointName); //required. get current value for the access point on the target
        setValue:function(target, accessPointName, value); //required. get current value for the access point on the target
        doesSupportMonitoring:function(target, accessPointName); //required. return true if the access point support data awareness

        monitor:function(target, accessPointName, callback); //optional. monitor the change of the access point (on the target)
        stopMonitoring:function(target, accessPointName, callback) //optional. stop monitoring the change of the access point(on the target)
    }

 */

(function(){
    var __private = Knot.getPrivateScope();

    var _elementAPProviders = [];
    var _tiedUpAPProviders = [];

    var DummyProvider = {
        doesSupport:function(target, apName){
            return true;
        },
        getValue:function(target, apName){
            return undefined;
        },
        setValue:function(target, apName, value){
        },
        doesSupportMonitoring:function(target, apName){
            return true;
        },
        monitor:function(target, apName, callback){
        },
        stopMonitoring:function(target, apName, callback){
        }
    };



    __private.AccessPointManager = {
        AP_TYPE:{
            ELEMENT:1,
            TIED_UP:2
        },

        //search the provider in reversed sequence, so that the later registered providers can
        //overwrite the default ones
        getProvider:function(type, target, apName){
            var providers = (type == __private.AccessPointManager.AP_TYPE.ELEMENT? _elementAPProviders: _tiedUpAPProviders);
            for(var i=providers.length-1; i >= 0; i--){
                if(providers[i].doesSupport(target, apName))
                    return providers[i];
            }

            __private.Log.error(__private.Log.Source.Knot,   "Failed to find Access Point Provider for Access Point '" + apName + "', target:" + target);
            return DummyProvider;
        },
        registerAPProvider: function(type, apProvider){
            if(type == this.AP_TYPE.ELEMENT){
                if(_elementAPProviders.indexOf(apProvider) < 0)
                    _elementAPProviders.push(apProvider);
            }
            else{
                if(_tiedUpAPProviders.indexOf(apProvider) < 0)
                    _tiedUpAPProviders.push(apProvider);
            }
        },

        getValueThroughPipe: function(provider, target, ap){
            var value = provider.getValue(target, ap.name);
            if(ap.pipes){
                for(var i=0; i< ap.pipes.length; i++){
                    var p = __private.GlobalSymbolHelper.getSymbol(ap.pipes[i]);
                    if(typeof(p) != "function"){
                        __private.Log.error(__private.Log.Source.Knot, "Pipe must be a function. pipe name:" + ap.pipes[i]);
                    }
                    value = p.apply(target, [value]);
                }
            }
            return value;
        },

        monitor:function(srcProvider, src, srcAP, tgtProvider, target, targetAP){
            if(srcProvider.doesSupportMonitoring(src, srcAP.name)){
                srcAP.changedCallback = function(){
                    tgtProvider.setValue(target, targetAP.name,
                        __private.AccessPointManager.getValueThroughPipe(srcProvider, src,  srcAP));
                };

                srcProvider.monitor(src, srcAP.name, srcAP.changedCallback);
            }
        },

        tieKnot:function(element, dataContext, knotInfo){
            var eleProvider = this.getProvider(this.AP_TYPE.ELEMENT, element, knotInfo.elementAP.name);
            var tieUpProvider = this.getProvider(this.AP_TYPE.TIED_UP, dataContext, knotInfo.tiedUpAP.name);

            //set initial value
            eleProvider.setValue(element, knotInfo.elementAP.name,
                this.getValueThroughPipe(tieUpProvider, dataContext,  knotInfo.tiedUpAP));

            this.monitor(eleProvider, element, knotInfo.elementAP, tieUpProvider, dataContext, knotInfo.tiedUpAP);
            this.monitor(tieUpProvider, dataContext, knotInfo.tiedUpAP, eleProvider, element, knotInfo.elementAP);
        },

        stopMonitoring:function(provider, target, ap){
            provider.stopMonitoring(target, ap.name, ap.changedCallback);
        },
        removeKnot: function(element, dataContext, knotInfo){
            var eleProvider = this.getProvider(this.AP_TYPE.ELEMENT, element, knotInfo.elementAP.name);
            this.stopMonitoring(eleProvider, element, knotInfo.elementAP);
            var tieUpProvider = this.getProvider(this.AP_TYPE.TIED_UP, dataContext, knotInfo.tiedUpAP.name);
            this.stopMonitoring(tieUpProvider, dataContext, knotInfo.tiedUpAP);
        }
    };

})();