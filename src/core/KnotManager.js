/*
    KnotManager take the responsibility of manager knots based on the knot option that parsed by the OptionParser.
    A knot always ties up two Access Points together.
    KnotManager tie the knot, and store the relevant information (callbacks, status etc...) on the knot option.
    When knot ties up the Access Points, there is often different data context for each of the Access Point. This is decided
    Knot Builder.

    It also takes the responsibility of Access Pointer Provider management.

    Access Pointer Provider:
        Access Point Provider provide the ability of set value/get value as well as observing the change for a particular type(s) of data.

    this is the interface of access point provider:
    {
        doesSupport: function (target, apDescription);  //required. return true if the access point on the target is supported
        getValue: function (target, apDescription, options, options); //required. get current value for the access point on the target
        setValue: function (target, apDescription, value, options); //required. get current value for the access point on the target
        doesSupportMonitoring: function (target, apDescription); //required. return true if the access point support data awareness

        monitor: function (target, apDescription, callback, options); //optional. monitor the change of the access point (on the target)
        stopMonitoring: function (target, apDescription, callback, options) //optional. stop monitoring the change of the access point(on the target)
    }
 */

(function (global) {
    "use strict";

    var __private = global.Knot.getPrivateScope();

    //This array holds the reference to the registered Access Pointer Provider.
    var _APProviders = [];
    //This array holds the reference to the registered Access Pointer Provider for error status.
    var _errorAPProvider = [];

    //raise an Access Point event. the Access Point Events are used to get notification when Access Point's status is changed
    //it is raised by using "target" object as "this" pointer
    function raiseAPEvent(target, options, eventName, params) {
        if(!options || !options[eventName]){
            return;
        }
        var f = __private.Utility.getValueOnPath(null, options[eventName]);
        if(!f || typeof(f) !== "function") {
            __private.Log.error("'"+options[eventName]+"' must be a function.");
        }
        else{
            try{
                f.apply(target, params);
            }
            catch (err) {
                __private.Log.error("Call AP event handler '"+options[eventName]+"' failed.", err);
            }
        }
    }

    //Error status Access Point always starts with "!"
    function isErrorStatusApDescription(name) {
        return (name && name[0] === "!");
    }

    //Access Point may contains target modifiers which change the target to
    //a object other than current data context.
    // This function returns the corrected target and AP description
    function correctAP(leftTarget, rightTarget, ap, isLeft) {
        //target modifier starts with "*". but we need to test whether it is a modifier in error status description (which starts with "!")
        if(ap.description && (ap.description[0] === "*" || ap.description[0] === "!") ) {
            var desToTest = ap.description;
            var isBindingToError = false;
            if(desToTest[0] === "!") {
                desToTest = __private.Utility.trim(desToTest.substr(1));
                isBindingToError = true;
                if(desToTest[0] !== "*"){
                    return  {target:isLeft?leftTarget:rightTarget, ap:ap};
                }
            }
            var newDescription;
            if(__private.Utility.startsWith(desToTest, "*LEFT")) {
                newDescription = desToTest.substr(5);
                isLeft = true;
            }
            if(__private.Utility.startsWith(desToTest, "*RIGHT")) {
                newDescription =  desToTest.substr(6);
                isLeft = false;
            }
            if(newDescription === ""){
                newDescription = "*";
            }
            //when there's path follows modifier
            if(newDescription && newDescription[0] === ".") {
                newDescription = newDescription.substr(1);
            }

            if(newDescription) {
                if(isBindingToError) {
                    newDescription = "!" + newDescription;
                }
                var newAP = {};
                for(var p in ap) {
                    if(ap.hasOwnProperty(p)) {
                        newAP[p] = ap[p];
                    }
                }
                newAP.description = newDescription;
                ap = newAP;
            }
        }
        return  {target:isLeft?leftTarget:rightTarget, ap:ap};
    }

    //return the corrected(by target modifier) target/AP options for the knot options
    function correctTarget(leftTarget, rightTarget, knotOption) {
        return {
            left:correctAP(leftTarget, rightTarget, knotOption.leftAP, true),
            right:correctAP(leftTarget, rightTarget, knotOption.rightAP, false)
        };
    }

    function isReadOnly(ap){
        if(ap.options && ap.options.readonly){
            var v = ap.options.readonly.toLowerCase();
            return (v === "1" || v === "true");
        }
        return false;
    }

    ////////////////////////////////////////////////////////////////////////////
    // KnotManager
    ////////////////////////////////////////////////////////////////////////////
    __private.KnotManager = {
        getProvider: function (target, apName) {
            //Error status APs use special providers
            if(isErrorStatusApDescription(apName)) {
                return this.getErrorAPProvider(target, apName) || __private.DefaultProvider;
            }

            //search the provider in reversed sequence, so that the later registered providers can
            //overwrite the default ones
            for(var i=_APProviders.length-1; i >= 0; i--) {
                if(_APProviders[i].doesSupport(target, apName)) {
                    return _APProviders[i];
                }
            }

            return __private.DefaultProvider;
        },
        getErrorAPProvider: function (target, apName) {
            //search the provider in reversed sequence, so that the later registered providers can
            //overwrite the default ones
            for(var i=_errorAPProvider.length-1; i >= 0; i--) {
                if(_errorAPProvider[i].doesSupport(target, apName)) {
                    return _errorAPProvider[i];
                }
            }

            return null;
        },
        registerAPProvider: function (apProvider, isErrorAP) {
            if(isErrorAP) {
                if(_errorAPProvider.indexOf(apProvider) < 0) {
                    _errorAPProvider.push(apProvider);
                }
            }
            else{
                if(_APProviders.indexOf(apProvider) < 0) {
                    _APProviders.push(apProvider);
                }
            }
        },
        unregisterAPProvider: function (apProvider, isErrorAP) {
            if(isErrorAP) {
                if(_errorAPProvider.indexOf(apProvider) >=0) {
                    _errorAPProvider.splice(_APProviders.indexOf(apProvider), 1);
                }
            }
            else{
                if(_APProviders.indexOf(apProvider) >=0) {
                    _APProviders.splice(_APProviders.indexOf(apProvider), 1);
                }
            }
        },


        //if objectToIndicateError is returned, it means something wrong happens when get value through pipe.
        objectToIndicateError:{},
        //get value by using the relevant AP provider, then call pipe functions to get the result.
        //if any error happens within pipes, set the error as the error status of the AP
        getValueThroughPipe: function (target, ap) {
            this.checkProvider(target, ap);
            var value = ap.provider.getValue(target, ap.description, ap.options);
            try{
                if(ap.pipes) {
                    for(var i=0; i< ap.pipes.length; i++) {
                        var p = __private.Utility.getValueOnPath(global, ap.pipes[i]);
                        if(typeof(p) !== "function") {
                            __private.Log.error( "Pipe must be a function. pipe name:" + ap.pipes[i]);
                        }
                        value = p.apply(target, [value]);
                    }
                    if(ap.errorAPProvider) {
                        ap.errorAPProvider.setValue(target, "!" + ap.description, undefined, ap.options);
                    }
                    __private.Debugger.errorStatusChanged(target, ap, undefined);
                }
            }
            catch (exception) {
                if(ap.errorAPProvider) {
                    ap.errorAPProvider.setValue(target, "!" + ap.description, exception, ap.options);
                    __private.Debugger.errorStatusChanged(target, ap, exception);
                }
                return this.objectToIndicateError;
            }
            return value;
        },

        //set value by using relevant provider. It also prevents code re-enter which may cause infinite
        //set value calls and stack overflow error.
        safeSetValue: function (target, ap, value) {
            if(ap.ignoreSettingValue) {
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

        notifyKnotChanged: function (left, right, option, value, isSetFromLeftToRight) {
            __private.Debugger.knotChanged(left, right, option, value, isSetFromLeftToRight);
        },

        //make sure the provider reference is correctly set on AP option
        checkProvider: function (target, ap) {
            if(!ap.provider) {
                ap.provider = this.getProvider(target, ap.description);
                ap.errorAPProvider = this.getErrorAPProvider(target, ap.description);
            }
        },

        //monitor the change of source AP and update target AP when source AP is changed.
        //the reference to the changed callback function is stored on knot option object (knotInfo)
        monitor: function (src, srcAP, target, targetAP, knotInfo) {
            this.checkProvider(src, srcAP);
            this.checkProvider(target, targetAP);
            if(srcAP.provider.doesSupportMonitoring(src, srcAP.description)) {
                srcAP.changedCallback = function () {
                    if(targetAP.ignoreSettingValue) {
                        return;
                    }

                    var v = __private.KnotManager.getValueThroughPipe(src,  srcAP);
                    if(v === __private.KnotManager.objectToIndicateError) {
                        return;
                    }
                    if(knotInfo.leftAP === srcAP) {
                        __private.KnotManager.notifyKnotChanged(src, target, knotInfo, v, true);
                    }
                    else{
                        __private.KnotManager.notifyKnotChanged(target, src, knotInfo, v, false);
                    }

                    srcAP.ignoreSettingValue = true;
                    try{
                        __private.KnotManager.safeSetValue(target, targetAP, v);
                    }
                    finally{
                        delete srcAP.ignoreSettingValue;
                    }
                    raiseAPEvent(src, srcAP.options, "@change", arguments);
                };
                srcAP.provider.monitor(src, srcAP.description, srcAP.changedCallback, srcAP.options);
            }
        },

        //stop monitoring the change. It used to stop the data observation that started by "monitor"
        stopMonitoring: function (target, ap) {
            this.checkProvider(target, ap);
            if(ap.changedCallback && ap.provider.doesSupportMonitoring(target, ap.description)) {
                ap.provider.stopMonitoring(target, ap.description, ap.changedCallback, ap.options);
                delete  ap.changedCallback;
            }
        },

        //tie a knot with composite access point
        tieCompositeAP: function (leftAP, leftTarget, rightAP, rightTarget, knotInfo) {
            //first find out which one is the composite AP
            //there can be only one composite AP in one knot
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
                compositeAP.childrenAPs[i].provider = __private.KnotManager.getProvider(compositeAPTarget, compositeAP.childrenAPs[i].description);
            }
            normalTarget.provider = __private.KnotManager.getProvider(normalTarget, normalAP.description);

            compositeAP.changedCallback = function () {
                var values = [];
                for (var i = 0; i < compositeAP.childrenAPs.length; i++) {
                    var v = __private.KnotManager.getValueThroughPipe(compositeAPTarget, compositeAP.childrenAPs[i]);
                    if (v === __private.KnotManager.objectToIndicateError) {
                        return;
                    }
                    values.push(v);
                }

                var p = __private.Utility.getValueOnPath(global, compositeAP.nToOnePipe);
                if (typeof(p) !== "function") {
                    __private.Log.error("Pipe must be a function. pipe name:" + compositeAP.nToOnePipe);
                }
                var latestValue = p.apply(compositeAPTarget, [values]);

                __private.KnotManager.notifyKnotChanged(leftTarget, rightTarget, knotInfo, latestValue, normalTarget === rightTarget);
                __private.KnotManager.safeSetValue(normalTarget, normalAP, latestValue);

                raiseAPEvent(normalTarget, normalAP, "@change", [leftTarget, rightTarget, knotInfo]);
            };

            for (i = 0; i < compositeAP.childrenAPs.length; i++) {
                if (compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)) {
                    compositeAP.childrenAPs[i].provider.monitor(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback, compositeAP.childrenAPs[i].options);
                }
            }
            //set the initial value
            compositeAP.changedCallback();
        },

        //tie up a knot.
        //leftTarget: the data context of the right AP
        //rightTarget: the data context of the left AP
        //knotInfo: knot options
        tieKnot: function (leftTarget, rightTarget, knotInfo) {
            var r = correctTarget(leftTarget, rightTarget, knotInfo);
            leftTarget = r.left.target; rightTarget = r.right.target;
            var leftAP = r.left.ap, rightAP = r.right.ap;

            if(leftAP.isComposite || rightAP.isComposite) {
                this.tieCompositeAP(leftAP, leftTarget, rightAP, rightTarget, knotInfo);
            }
            else{
                this.checkProvider(leftTarget,  leftAP);
                this.checkProvider(rightTarget,  rightAP);

                //set initial value
                //if both sides are readonly, or leftSide is not read only, set left from right
                //otherwise set right from left;

                var v;
                if(!isReadOnly(leftAP) || (isReadOnly(leftAP) && isReadOnly(rightAP))){
                    //set initial value, always use the left side value as initial value
                    v = this.getValueThroughPipe(rightTarget,  rightAP);
                    if(v !== this.objectToIndicateError) {
                        this.notifyKnotChanged(leftTarget, rightTarget, knotInfo, v, false);
                        this.safeSetValue(leftTarget, leftAP, v);
                    }
                }
                else{
                    //set initial value, always use the left side value as initial value
                    v = this.getValueThroughPipe(leftTarget,  leftAP);
                    if(v !== this.objectToIndicateError) {
                        this.notifyKnotChanged(rightTarget, leftTarget, knotInfo, v, false);
                        this.safeSetValue(rightTarget, rightAP, v);
                    }
                }

                if(!isReadOnly(rightAP)){
                    this.monitor(leftTarget, leftAP, rightTarget, rightAP, knotInfo);
                }
                if(!isReadOnly(leftAP)){
                    this.monitor(rightTarget, rightAP, leftTarget, leftAP, knotInfo);
                }
            }
            __private.Debugger.knotTied(leftTarget, rightTarget, knotInfo);
        },

        //untie a knot
        untieKnot: function (leftTarget, rightTarget, knotInfo) {
            var r = correctTarget(leftTarget, rightTarget, knotInfo);
            leftTarget = r.left.target; rightTarget = r.right.target;
            var leftAP = r.left.ap, rightAP = r.right.ap;

            if(leftAP.isComposite || rightAP.isComposite) {
                var compositeAP, compositeAPTarget;
                if(leftAP.isComposite) {
                    compositeAP = leftAP; compositeAPTarget = leftTarget;
                }
                else{
                    compositeAP = rightAP; compositeAPTarget = rightTarget;
                }

                if(compositeAP.changedCallback) {
                    for(var i=0; i< compositeAP.childrenAPs.length; i++) {
                        if(compositeAP.childrenAPs[i].provider.doesSupportMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description)) {
                            compositeAP.childrenAPs[i].provider.stopMonitoring(compositeAPTarget, compositeAP.childrenAPs[i].description, compositeAP.changedCallback, compositeAP.childrenAPs[i].options);
                        }
                    }
                }
                delete compositeAP.changedCallback;
            }
            else{
                this.stopMonitoring(leftTarget, leftAP);
                delete leftAP.changedCallback;
                this.stopMonitoring(rightTarget, rightAP);
                delete rightAP.changedCallback;
            }
            __private.Debugger.knotUntied(leftTarget, rightTarget, knotInfo);
        },

        //force calling the changed callback to update the value
        //this is often used in scenarios such as force validating data
        forceUpdateValue: function (ap) {
            if(ap.changedCallback) {
                ap.changedCallback();
            }
        }
    };



    //this is the default provider
    //it takes all of the object as normal javscript object and AP description as the path of the value
    //it uses DataObserver to monitoring the chang of the value
    __private.DefaultProvider = {
        doesSupport: function (target, apName) {
            return true;
        },
        getValue: function (target, apName, options) {

            if(apName[0] === "@") {
                apName = apName.substr(1);
            }
            return __private.Utility.getValueOnPath(target, apName);
        },


        setValue: function (target, apName, value, options) {
            __private.Utility.setValueOnPath(target, apName, value);
        },
        doesSupportMonitoring: function (target, apName) {
            if(typeof(target) !== "object") {
                return false;
            }
            return true;
        },
        monitor: function (target, apName, callback, options) {
            if(apName && apName[0] === "/") {
                target = global;
                apName = apName.substr(1);
            }
            if(target) {
                __private.DataObserver.monitor(target, apName, callback);
            }
        },
        stopMonitoring: function (target, apName, callback, options) {
            if(apName && apName[0] === "/") {
                target = global;
                apName = apName.substr(1);
            }
            if(target) {
                __private.DataObserver.stopMonitoring(target, apName, callback);
            }
        }
    };
})(window);