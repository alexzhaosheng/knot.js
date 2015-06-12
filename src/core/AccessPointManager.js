/*
    accessPointerProvider:
        an object which provide the ability of setting value/getting value/eventChange for specified
        access point on the target

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

(function(window){
    var __private = window.Knot.getPrivateScope();

    var _APProviders = [];

    __private.DefaultProvider = {
        doesSupport:function(target, apName){
            return true;
        },
        getValue: function(target, apName){
            return __private.Utility.getValueOnPath(target, apName);
        },
        setValue: function(target, apName, value){
            return __private.Utility.setValueOnPath(target, apName, value);
        },
        doesSupportMonitoring: function(target, apName){
            if(typeof(target) != "object" && typeof(target) != "array"){
                return false;
            }
            return true;
        },
        monitor: function(target, apName, callback){
            if(apName && apName[0] == "/"){
                target = window;
                apName = apName.substr(1);
            }
            if(target)
                __private.DataMonitor.monitor(target, apName, callback);
        },
        stopMonitoring: function(target, apName, callback){
            if(apName && apName[0] == "/"){
                target = window;
                apName = apName.substr(1);
            }
            if(target)
                __private.DataMonitor.stopMonitoring(target, apName, callback);
        }
    };

    function isErrorStatusApName(name){
        return (name && name[0] == "!");
    }

    __private.AccessPointManager = {
        //search the provider in reversed sequence, so that the later registered providers can
        //overwrite the default ones
        getProvider:function(target, apName){
            for(var i=_APProviders.length-1; i >= 0; i--){
                if(_APProviders[i].doesSupport(target, apName))
                    return _APProviders[i];
            }

            return __private.DefaultProvider;
        },
        registerAPProvider: function(apProvider){
            if(_APProviders.indexOf(apProvider) < 0)
                _APProviders.push(apProvider);
        },
        unregisterAPProvider:function(apProvider){
            if(_APProviders.indexOf(apProvider) >=0)
                _APProviders.splice(_APProviders.indexOf(apProvider), 1);
        },

        getValueThroughPipe: function(target, ap){
            if(!ap.provider)
                ap.provider = this.getProvider(target, ap.description);
            var value = ap.provider.getValue(target, ap.description);
            try{
                if(ap.pipes){
                    for(var i=0; i< ap.pipes.length; i++){
                        var p = __private.GlobalSymbolHelper.getSymbol(ap.pipes[i]);
                        if(typeof(p) != "function"){
                            __private.Log.error( "Pipe must be a function. pipe name:" + ap.pipes[i]);
                        }
                        value = p.apply(target, [value]);
                    }
                    if(ap.provider.doesSupportErrorStatus && !isErrorStatusApName(ap.description))
                         ap.provider.setValue(target, "!"+ap.description, undefined);
                }
            }
            catch (exception){
                if(ap.provider.doesSupportErrorStatus && !isErrorStatusApName(ap.description))
                    ap.provider.setValue(target, "!"+ap.description, exception);
                return undefined;
            }
            return value;
        },

        monitor:function(src, srcAP, target, targetAP){
            if(!srcAP.provider)
                srcAP.provider = this.getProvider(src, srcAP.description);
            if(!targetAP.provider)
                targetAP.provider = this.getProvider(target, targetAP.description);
            if(srcAP.provider.doesSupportMonitoring(src, srcAP.description)){
                srcAP.changedCallback = function(){
                    targetAP.provider.setValue(target, targetAP.description,
                        __private.AccessPointManager.getValueThroughPipe(src,  srcAP));
                };

                srcAP.provider.monitor(src, srcAP.description, srcAP.changedCallback);
            }
        },

        stopMonitoring:function(target, ap){
            if(!ap.provider)
                ap.provider = this.getProvider(target, ap.description);
            if(ap.provider.doesSupportMonitoring(target, ap.description) && ap.changedCallback){
                ap.provider.stopMonitoring(target, ap.description, ap.changedCallback);
                delete  ap.changedCallback;
            }
        },

        tieKnot:function(leftTarget, rightTarget, knotInfo){
            if(knotInfo.leftAP.isComposite || knotInfo.rightAP.isComposite){
                var compositeAP, compositeAPTarget, normalAP, normalTarget;
                if(knotInfo.leftAP.isComposite){
                    compositeAP = knotInfo.leftAP; compositeAPTarget = leftTarget;
                    normalAP = knotInfo.rightAP; normalTarget = rightTarget;
                }
                else{
                    compositeAP = knotInfo.rightAP; compositeAPTarget = rightTarget;
                    normalAP = knotInfo.leftAP; normalTarget = leftTarget;
                }

                for(var i=0; i< compositeAP.childrenAPs.length; i++){
                    compositeAP.childrenAPs[i].provider = __private.AccessPointManager.getProvider(compositeAPTarget, compositeAP.childrenAPs[i].description);
                }
                normalTarget.provider = __private.AccessPointManager.getProvider(normalTarget, normalAP.description);

                compositeAP.changedCallback = function(){
                    var values=[];
                    for(var i=0; i< compositeAP.childrenAPs.length; i++){
                        values.push(__private.AccessPointManager.getValueThroughPipe(compositeAPTarget, compositeAP.childrenAPs[i]));
                    }

                    var p = __private.GlobalSymbolHelper.getSymbol(compositeAP.nToOnePipe);
                    if(typeof(p) != "function"){
                        __private.Log.error( "Pipe must be a function. pipe name:" + compositeAP.nToOnePipe);
                    }
                    var lastValue = p.apply(compositeAP, [values]);

                    normalTarget.provider.setValue(normalTarget, normalAP.description, lastValue);
                }

                for(var i=0; i< compositeAP.childrenAPs.length; i++){
                    if(compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)){
                        compositeAP.childrenAPs[i].provider.monitor(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback);
                    }
                }
                //set the initial value
                compositeAP.changedCallback();
            }
            else{
                knotInfo.leftAP.provider = this.getProvider(leftTarget, knotInfo.leftAP.description);
                knotInfo.rightAP.provider = this.getProvider(rightTarget, knotInfo.rightAP.description);

                //set initial value, always use the left side value as initial value
                knotInfo.leftAP.provider.setValue(leftTarget, knotInfo.leftAP.description,
                    this.getValueThroughPipe(rightTarget,  knotInfo.rightAP));

                this.monitor(leftTarget, knotInfo.leftAP, rightTarget, knotInfo.rightAP);
                this.monitor(rightTarget, knotInfo.rightAP, leftTarget, knotInfo.leftAP);
            }
        },

        untieKnot: function(leftTarget, rightTarget, knotInfo){
            if(knotInfo.leftAP.isComposite || knotInfo.rightAP.isComposite){
                var compositeAP, compositeAPTarget;
                if(knotInfo.leftAP.isComposite){
                    compositeAP = knotInfo.leftAP; compositeAPTarget = leftTarget;
                }
                else{
                    compositeAP = knotInfo.rightAP; compositeAPTarget = rightTarget;
                }

                if(compositeAP.changedCallback){
                    for(var i=0; i< compositeAP.childrenAPs.length; i++){
                        if(compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)){
                            compositeAP.childrenAPs[i].provider.stopMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback);
                        }
                    }
                }

                delete compositeAP.changedCallback;
            }
            else{
                this.stopMonitoring(leftTarget, knotInfo.leftAP);
                delete knotInfo.leftAP.changedCallback;
                this.stopMonitoring(rightTarget, knotInfo.rightAP);
                delete knotInfo.rightAP.changedCallback;
            }
        }
    };
})((function() {
        return this;
    })());