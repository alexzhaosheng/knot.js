(function(){
    var scope = Knot.getPrivateScope();

    var TestAccessPointerProvider = function(type, supportTarget, apName){
        this.supportTarget = supportTarget;
        this.apName = apName;
        this.type = type;
    };
    TestAccessPointerProvider.prototype.doesSupport = function(target, apName){
        if(this.supportTarget){
            return target == this.supportTarget && this.apName == apName;
        }
        return target.type == this.type;
    };
    TestAccessPointerProvider.prototype.getValue = function(target, apName){
        return scope.Utility.getValueOnPath(target, apName);
    };
    TestAccessPointerProvider.prototype.setValue = function(target, apName, value){
        return scope.Utility.setValueOnPath(target, apName, value);
    };
    TestAccessPointerProvider.prototype.doesSupportMonitoring = function(target, apName){
        return true;
    };
    TestAccessPointerProvider.prototype.monitor = function(target, apName, callback){
        scope.DataMonitor.monitor(target, apName, callback);
    }
    TestAccessPointerProvider.prototype.stopMonitoring = function(target, apName, callback){
        scope.DataMonitor.stopMonitoring(target, apName, callback);
    }


    var elementAPProvider = new TestAccessPointerProvider("element");
    var tiedAPUpProvider = new TestAccessPointerProvider("tiedUp");
    scope.AccessPointManager.registerAPProvider(scope.AccessPointManager.AP_TYPE.ELEMENT, elementAPProvider);
    scope.AccessPointManager.registerAPProvider(scope.AccessPointManager.AP_TYPE.TIED_UP, tiedAPUpProvider);
    QUnit.test( "private.AccessPointerManager", function( assert ) {
        var element={type:"element"}, dataContext={type:"tiedUp"};

        var testAp = new TestAccessPointerProvider("element", element, "value");
        scope.AccessPointManager.registerAPProvider(scope.AccessPointManager.AP_TYPE.ELEMENT, testAp);

        assert.equal(scope.AccessPointManager.getProvider(scope.AccessPointManager.AP_TYPE.ELEMENT, element,"value"),
                    testAp);
        assert.equal(scope.AccessPointManager.getProvider(scope.AccessPointManager.AP_TYPE.ELEMENT, dataContext,"value") != elementAPProvider,
            true);
        assert.equal(scope.AccessPointManager.getProvider(scope.AccessPointManager.AP_TYPE.ELEMENT, element,"testAX"),
            elementAPProvider);
        assert.equal(scope.AccessPointManager.getProvider(scope.AccessPointManager.AP_TYPE.TIED_UP, dataContext,"value"),
            tiedAPUpProvider);


        element.value = true;
        var knots = scope.OptionParser.parse("value>{return value?10:1;}:apOnData.intValue>{return value>2?true:false;}");
        assert.equal(scope.AccessPointManager.getValueThroughPipe(elementAPProvider, element, knots[0].elementAP),
                    10);
        assert.equal(scope.AccessPointManager.getValueThroughPipe(elementAPProvider, dataContext, knots[0].elementAP),
            1);

        dataContext.apOnData = {intValue:1};
        assert.equal(scope.AccessPointManager.getValueThroughPipe(tiedAPUpProvider, dataContext, knots[0].tiedUpAP),
            false);
        dataContext.apOnData.intValue = 10;
        assert.equal(scope.AccessPointManager.getValueThroughPipe(tiedAPUpProvider, dataContext, knots[0].tiedUpAP),
            true);


        element.value = false;
        scope.AccessPointManager.tieKnot(element, dataContext, knots[0]);

        //initial value should be set from dataContext to element
        assert.equal(element.value, true);
        assert.equal(dataContext.apOnData.intValue, 10);

        dataContext.apOnData.intValue = 1;
        assert.equal(element.value, false);
        assert.equal(dataContext.apOnData.intValue, 1);

        dataContext.apOnData.intValue = 10;
        assert.equal(element.value, true);
        assert.equal(dataContext.apOnData.intValue, 10);

        element.value = false;
        assert.equal(element.value, false);
        assert.equal(dataContext.apOnData.intValue, 1);

        element.value = true;
        assert.equal(element.value, true);
        assert.equal(dataContext.apOnData.intValue, 10);


        scope.AccessPointManager.removeKnot(element, dataContext, knots[0]);
        element.value = false;
        assert.equal(element.value, false);
        assert.equal(dataContext.apOnData.intValue, 10);

        element.value = true;
        assert.equal(element.value, true);
        assert.equal(dataContext.apOnData.intValue, 10);

        dataContext.apOnData.intValue = 1;
        assert.equal(element.value, true);
        assert.equal(dataContext.apOnData.intValue, 1);
    });
})();