/*
    accessPointerProvider:
        an object which provide the ability of setting value/getting value/eventChange for specified
        access point on the target

    this is the interface of access point provider:
    {
        doesSupport: function (target, accessPointName);  //required. return true if the access point on the target is supported
        getValue: function (target, accessPointName, options); //required. get current value for the access point on the target
        setValue: function (target, accessPointName, value, options); //required. get current value for the access point on the target
        doesSupportMonitoring: function (target, accessPointName); //required. return true if the access point support data awareness

        monitor: function (target, accessPointName, callback, options); //optional. monitor the change of the access point (on the target)
        stopMonitoring: function (target, accessPointName, callback, options) //optional. stop monitoring the change of the access point(on the target)
    }
 */

(function (window) {
    var __private = window.Knot.getPrivateScope();

    var _APProviders = [];
    var _errorAPProvider = [];

    function raiseAPEvent(target, options, eventName, params){
        if(!options || !options[eventName])
            return;
        var f = __private.Utility.getValueOnPath(null, options[eventName]);
        if(!f || typeof(f) != "function"){
            __private.Log.error("'"+options[options[eventName]]+"' must be a function.");
        }
        else{
            try{
                f.apply(target, params);
            }
            catch (err){
                __private.Log.error("Call AP event handler '"+options[options[eventName]]+"' failed.", err);
            }
        }
    };


    function isErrorStatusApName(name){
        return (name && name[0] == "!");
    }

    function correctAP(leftTarget, rightTarget, ap, isLeft){
        if(ap.description && (ap.description[0] == "*" || ap.description[0] == "!") ){
            var desToTest = ap.description;
            var isBindingToError = false;
            if(desToTest[0] == "!"){
                desToTest = __private.Utility.trim(desToTest.substr(1));
                isBindingToError = true;
                if(desToTest[0] != "*")
                    return  {target:isLeft?leftTarget:rightTarget, ap:ap};
            }
            var newDescription;
            if(__private.Utility.startsWith(desToTest, "*LEFT")){
                newDescription = desToTest.substr(5);
                isLeft = true;
            }
            if(__private.Utility.startsWith(desToTest, "*RIGHT")){
                newDescription =  desToTest.substr(6);
                isLeft = false;
            }
            if(newDescription === "")
                newDescription = "*";
            //when there's path follows modifier
            if(newDescription && newDescription[0] == ".")
                newDescription = newDescription.substr(1);

            if(newDescription){
                if(isBindingToError)
                    newDescription="!"+newDescription;
                var newAP = {};
                for(var p in ap) newAP[p] = ap[p];
                newAP.description = newDescription;
                ap = newAP;
            }
        }
        return  {target:isLeft?leftTarget:rightTarget, ap:ap};
    }

    function correctTarget(leftTarget, rightTarget, knotOption){
        return {
            left:correctAP(leftTarget, rightTarget, knotOption.leftAP, true),
            right:correctAP(leftTarget, rightTarget, knotOption.rightAP, false)
        };
    }

    __private.AccessPointManager = {
        //search the provider in reversed sequence, so that the later registered providers can
        //overwrite the default ones
        getProvider: function (target, apName){
            if(isErrorStatusApName(apName)){
                return this.getErrorAPProvider(target, apName) || __private.DefaultProvider;
            }
            for(var i=_APProviders.length-1; i >= 0; i--){
                if(_APProviders[i].doesSupport(target, apName))
                    return _APProviders[i];
            }

            return __private.DefaultProvider;
        },
        getErrorAPProvider: function (target, apName){
            for(var i=_errorAPProvider.length-1; i >= 0; i--){
                if(_errorAPProvider[i].doesSupport(target, apName))
                    return _errorAPProvider[i];
            }

            return null;
        },
        registerAPProvider: function (apProvider, isErrorAP){
            if(isErrorAP){
                if(_errorAPProvider.indexOf(apProvider) < 0)
                    _errorAPProvider.push(apProvider);
            }
            else{
                if(_APProviders.indexOf(apProvider) < 0)
                    _APProviders.push(apProvider);
            }
        },
        unregisterAPProvider: function (apProvider, isErrorAP){
            if(isErrorAP){
                if(_errorAPProvider.indexOf(apProvider) >=0)
                    _errorAPProvider.splice(_APProviders.indexOf(apProvider), 1);
            }
            else{
                if(_APProviders.indexOf(apProvider) >=0)
                    _APProviders.splice(_APProviders.indexOf(apProvider), 1);
            }
        },




        objectToIndicateError:{},
        getValueThroughPipe: function (target, ap){
            this.checkProvider(target, ap);
            var value = ap.provider.getValue(target, ap.description, ap.options);
            try{
                if(ap.pipes){
                    for(var i=0; i< ap.pipes.length; i++){
                        var p = __private.Utility.getValueOnPath(window, ap.pipes[i]);
                        if(typeof(p) != "function"){
                            __private.Log.error( "Pipe must be a function. pipe name:" + ap.pipes[i]);
                        }
                        value = p.apply(target, [value]);
                    }
                    if(ap.errorAPProvider)
                         ap.errorAPProvider.setValue(target, "!" + ap.description, undefined);
                }
            }
            catch (exception){
                if(ap.errorAPProvider)
                    ap.errorAPProvider.setValue(target, "!"+ap.description, exception);
                return this.objectToIndicateError;
            }
            return value;
        },

        safeSetValue: function (target, ap, value){
            if(ap.ignoreSettingValue){
                return;
            }
            ap.ignoreSettingValue = true;
            try{
                this.checkProvider(target, ap);

                ap.provider.setValue(target, ap.description, value, ap.options);
                raiseAPEvent(target, ap.options, "@set", [ap.description, value]);
            }
            finally{
                delete ap.ignoreSettingValue;
            }
        },

        notifyKnotChanged: function (left, right, option, value, isSetFromLeftToRight){
            if(option && option.knotEvent && option.knotEvent["@change"]){
                for(var i=0; i<option.knotEvent["@change"].length; i++){
                    try{
                        var handler = __private.Utility.getValueOnPath(null, option.knotEvent["@change"][i].substr(1));
                        handler(left, right, option, value, isSetFromLeftToRight);
                    }
                    catch (err){
                        __private.Log.error("Call knot event 'change' handler failed.", err);
                    }
                }
            }

            __private.Debugger.knotChanged(left, right, option, value, isSetFromLeftToRight);
        },

        checkProvider: function (target, ap){
            if(!ap.provider){
                ap.provider = this.getProvider(target, ap.description);
                ap.errorAPProvider = this.getErrorAPProvider(target, ap.description);
            }
        },
        monitor: function (src, srcAP, target, targetAP, knotInfo){
            this.checkProvider(src, srcAP);
            this.checkProvider(target, targetAP);
            if(srcAP.provider.doesSupportMonitoring(src, srcAP.description)){
                srcAP.changedCallback = function (){
                    if(targetAP.ignoreSettingValue)
                        return;

                    var v = __private.AccessPointManager.getValueThroughPipe(src,  srcAP);
                    if(v == __private.AccessPointManager.objectToIndicateError)
                        return;
                    if(knotInfo.leftAP == srcAP){
                        __private.AccessPointManager.notifyKnotChanged(src, target, knotInfo, v, true);
                    }
                    else{
                        __private.AccessPointManager.notifyKnotChanged(target, src, knotInfo, v, false);
                    }

                    srcAP.ignoreSettingValue = true;
                    try{
                        __private.AccessPointManager.safeSetValue(target, targetAP, v);
                    }
                    finally{
                        delete srcAP.ignoreSettingValue;
                    }
                    raiseAPEvent(src, srcAP.options, "@change", arguments);
                };
                srcAP.provider.monitor(src, srcAP.description, srcAP.changedCallback, srcAP.options);
            }
        },

        stopMonitoring: function (target, ap){
            this.checkProvider(target, ap);
            if(ap.provider.doesSupportMonitoring(target, ap.description) && ap.changedCallback){
                ap.provider.stopMonitoring(target, ap.description, ap.changedCallback, ap.options);
                delete  ap.changedCallback;
            }
        },

        tieCompositeAP: function (leftAP, leftTarget, rightAP, rightTarget, knotInfo) {
            var compositeAP, compositeAPTarget, normalAP, normalTarget;
            if (leftAP.isComposite) {
                compositeAP = leftAP;
                compositeAPTarget = leftTarget;
                normalAP = rightAP;
                normalTarget = rightTarget;
            }
            else {
                compositeAP = rightAP;
                compositeAPTarget = rightTarget;
                normalAP = leftAP;
                normalTarget = leftTarget;
            }

            for (var i = 0; i < compositeAP.childrenAPs.length; i++) {
                compositeAP.childrenAPs[i].provider = __private.AccessPointManager.getProvider(compositeAPTarget, compositeAP.childrenAPs[i].description);
            }
            normalTarget.provider = __private.AccessPointManager.getProvider(normalTarget, normalAP.description);

            compositeAP.changedCallback = function () {
                var values = [];
                for (var i = 0; i < compositeAP.childrenAPs.length; i++) {
                    var v = __private.AccessPointManager.getValueThroughPipe(compositeAPTarget, compositeAP.childrenAPs[i]);
                    if (v == this.objectToIndicateError)
                        return;
                    values.push(v);
                }

                var p = __private.Utility.getValueOnPath(window, compositeAP.nToOnePipe);
                if (typeof(p) != "function") {
                    __private.Log.error("Pipe must be a function. pipe name:" + compositeAP.nToOnePipe);
                }
                var latestValue = p.apply(compositeAP, [values]);

                __private.AccessPointManager.notifyKnotChanged(leftTarget, rightTarget, knotInfo, latestValue, normalTarget == rightTarget);
                __private.AccessPointManager.safeSetValue(normalTarget, normalAP, latestValue);

                raiseAPEvent(normalTarget, normalAP, "@change", [leftTarget, rightTarget, knotInfo]);
            }

            for (var i = 0; i < compositeAP.childrenAPs.length; i++) {
                if (compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)) {
                    compositeAP.childrenAPs[i].provider.monitor(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback, compositeAP.childrenAPs[i].options);
                }
            }
            //set the initial value
            compositeAP.changedCallback();
        },

        tieKnot: function (leftTarget, rightTarget, knotInfo){
            var r = correctTarget(leftTarget, rightTarget, knotInfo);
            leftTarget = r.left.target; rightTarget = r.right.target;
            var leftAP = r.left.ap, rightAP = r.right.ap;

            if(leftAP.isComposite || rightAP.isComposite){
                this.tieCompositeAP(leftAP, leftTarget, rightAP, rightTarget, knotInfo);
            }
            else{
                this.checkProvider(leftTarget,  leftAP);
                this.checkProvider(rightTarget,  rightAP);

                //set initial value, always use the left side value as initial value
                var v = this.getValueThroughPipe(rightTarget,  rightAP);
                if(v == this.objectToIndicateError)
                    return;
                this.notifyKnotChanged(leftTarget, rightTarget, knotInfo, v, false);
                this.safeSetValue(leftTarget, leftAP, v);

                this.monitor(leftTarget, leftAP, rightTarget, rightAP, knotInfo);
                this.monitor(rightTarget, rightAP, leftTarget, leftAP, knotInfo);
            }
            __private.Debugger.knotTied(leftTarget, rightTarget, knotInfo);
        },

        untieKnot: function (leftTarget, rightTarget, knotInfo){
            var r = correctTarget(leftTarget, rightTarget, knotInfo);
            leftTarget = r.left.target; rightTarget = r.right.target;
            var leftAP = r.left.ap, rightAP = r.right.ap;

            if(leftAP.isComposite || rightAP.isComposite){
                var compositeAP, compositeAPTarget;
                if(leftAP.isComposite){
                    compositeAP = leftAP; compositeAPTarget = leftTarget;
                }
                else{
                    compositeAP = rightAP; compositeAPTarget = rightTarget;
                }

                if(compositeAP.changedCallback){
                    for(var i=0; i< compositeAP.childrenAPs.length; i++){
                        if(compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)){
                            compositeAP.childrenAPs[i].provider.stopMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback, compositeAP.childrenAPs[i].options);
                        }
                    }
                }
                delete compositeAP.changedCallback;
            }
            else{
                this.stopMonitoring(leftTarget, leftAP, leftAP.options);
                delete leftAP.changedCallback;
                this.stopMonitoring(rightTarget, rightAP, rightAP.options);
                delete rightAP.changedCallback;
            }
            __private.Debugger.knotUntied(leftTarget, rightTarget, knotInfo);
        },

        forceUpdateValue: function (ap){
            if(ap.changedCallback)
                ap.changedCallback();
        }
    };



    __private.DefaultProvider = {
        doesSupport: function (target, apName){
            return true;
        },
        getValue: function (target, apName, options){
            var returnFunc = false;
            if(apName[0] == "@"){
                returnFunc = true;
                apName = apName.substr(1);
            }
            var value =  __private.Utility.getValueOnPath(target, apName);
            if(typeof(value) == "function" && !returnFunc){
                try{
                    return value.apply(target);
                }
                catch(err){
                    __private.Log.error("Call get value function failed.", err);
                    return undefined;
                }
            }
            else{
                return value;
            }
        },



        setValue: function (target, apName, value, options){
            __private.Utility.setValueOnPath(target, apName, value);
        },
        doesSupportMonitoring: function (target, apName){
            if(typeof(target) != "object" && typeof(target) != "array"){
                return false;
            }
            return true;
        },
        monitor: function (target, apName, callback, options){
            if(apName && apName[0] == "/"){
                target = window;
                apName = apName.substr(1);
            }
            if(target){
                __private.DataObserver.monitor(target, apName, callback);
            }
        },
        stopMonitoring: function (target, apName, callback, options){
            if(apName && apName[0] == "/"){
                target = window;
                apName = apName.substr(1);
            }
            if(target){
                __private.DataObserver.stopMonitoring(target, apName, callback);
            }
        }
    };
})((function () {
        return this;
    })());