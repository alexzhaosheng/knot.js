(function(){
    var scope = Knot.getPrivateScope();

    var TestAccessPointerProvider = function(supportTarget, apName){
        this.supportTarget = supportTarget;
        this.apName = apName;
    };
    TestAccessPointerProvider.prototype.doesSupport = function(target, apName){
        if(this.supportTarget){
            return target == this.supportTarget && this.apName == apName;
        }
        return true;
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



    QUnit.test( "private.AccessPointerManager", function( assert ) {
        var target1={}, target2={}, target3={};

        var apProvider = new TestAccessPointerProvider();
        scope.AccessPointManager.registerAPProvider(apProvider);
        var testAp = new TestAccessPointerProvider(target1, "value");
        scope.AccessPointManager.registerAPProvider(testAp);

        assert.equal(scope.AccessPointManager.getProvider(target1,"value"),
                    testAp);
        assert.equal(scope.AccessPointManager.getProvider(target1,"testAX"),
            apProvider);
        assert.equal(scope.AccessPointManager.getProvider(target2,"value"),
            apProvider);

        scope.AccessPointManager.unregisterAPProvider(testAp);
        scope.AccessPointManager.unregisterAPProvider(apProvider);

        target1.value = true;
        var knots = scope.OptionParser.parse("value>{return value?10:1;}:apOnData.intValue>{return value>2?true:false;}");
        knots[0].leftAP.provider = scope.AccessPointManager.getProvider(target1, knots[0].leftAP.name);
        knots[0].rightAP.provider = scope.AccessPointManager.getProvider(target2, knots[0].rightAP.name);
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target1, knots[0].leftAP),
                    10);
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].leftAP),
            1);

        target2.apOnData = {intValue:1};
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].rightAP),
            false);
        target2.apOnData.intValue = 10;
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].rightAP),
            true);


        target1.value = false;
        scope.AccessPointManager.tieKnot(target1, target2, knots[0]);

        //initial value should be set from dataContext to element
        assert.equal(target1.value, true);
        assert.equal(target2.apOnData.intValue, 10);

        target2.apOnData.intValue = 1;
        assert.equal(target1.value, false);
        assert.equal(target2.apOnData.intValue, 1);

        target2.apOnData.intValue = 10;
        assert.equal(target1.value, true);
        assert.equal(target2.apOnData.intValue, 10);

        target1.value = false;
        assert.equal(target1.value, false);
        assert.equal(target2.apOnData.intValue, 1);

        target1.value = true;
        assert.equal(target1.value, true);
        assert.equal(target2.apOnData.intValue, 10);


        scope.AccessPointManager.untieKnot(target1, target2, knots[0]);
        target1.value = false;
        assert.equal(target1.value, false);
        assert.equal(target2.apOnData.intValue, 10);

        target1.value = true;
        assert.equal(target1.value, true);
        assert.equal(target2.apOnData.intValue, 10);

        target2.apOnData.intValue = 1;
        assert.equal(target1.value, true);
        assert.equal(target2.apOnData.intValue, 1);


        //test pipes in global scope
        var latestThisPointer = null;
        window.converter = {
            intToString:function(value){
                latestThisPointer = this;
                switch (value){
                    case 1:
                        return "one";
                    case 2:
                        return "two";
                    default:
                        throw new Error("Unknow number:"+value);
                }
             },
            strToInt:function(value){
                switch (value){
                    case "one":
                        return 1;
                    case "two":
                        return 2;
                    default:
                        throw new Error("Unknow number:"+value);
                }
            },
            dotsToInt:function(value){
                return value.length;
            },
            intToDots:function(value){
                var f = "";
                for(var i=0;i<value;i++)
                    f+=".";
                return f;
            }
        };

        knots = scope.OptionParser.parse("strValue>converter.strToInt:intValue>converter.intToString");
        target2 = {intValue: 1};
        target1 = {strValue: ""};
        scope.AccessPointManager.tieKnot(target1, target2, knots[0]);

        assert.equal(target1.strValue, "one");
        assert.equal(target2.intValue, 1);
        assert.equal(target2, latestThisPointer);

        target2.intValue = 2;
        assert.equal(target1.strValue, "two");
        assert.equal(target2.intValue, 2);

        scope.AccessPointManager.untieKnot(target1, target2, knots[0]);


        //test multiple knots tied up to the same AP

        var knot1 = scope.OptionParser.parse("strValue>converter.strToInt:intValue>converter.intToString")[0];
        var knot2 = scope.OptionParser.parse("dotValue>converter.dotsToInt:intValue>converter.intToDots")[0];
        target2.intValue = 2;
        target1.strValue = "one";
        target3.dotValue = ".";
        scope.AccessPointManager.tieKnot(target1, target2, knot1);
        scope.AccessPointManager.tieKnot(target3, target2, knot2);

        assert.equal(target1.strValue, "two");
        assert.equal(target3.dotValue, "..");
        assert.equal(target2.intValue, 2);

        target1.strValue = "one";
        assert.equal(target1.strValue, "one");
        assert.equal(target3.dotValue, ".");
        assert.equal(target2.intValue, 1);

        target3.dotValue = "..";
        assert.equal(target1.strValue, "two");
        assert.equal(target3.dotValue, "..");
        assert.equal(target2.intValue, 2);

        target2.intValue = 1;
        assert.equal(target1.strValue, "one");
        assert.equal(target3.dotValue, ".");
        assert.equal(target2.intValue, 1);

        scope.AccessPointManager.untieKnot(target1, target2, knot1);
        target3.dotValue = "..";
        assert.equal(target1.strValue, "one");
        assert.equal(target3.dotValue, "..");
        assert.equal(target2.intValue, 2);

        scope.AccessPointManager.untieKnot(target3, target2, knot2);
        target3.dotValue = ".";
        assert.equal(target1.strValue, "one");
        assert.equal(target3.dotValue, ".");
        assert.equal(target2.intValue, 2);


        window.areTheySame = function(values){
            for(var i=1; i< values.length; i++){
                if(values[i-1] != values[i])
                    return false;
            }
            return true;
        }

        //test composite AP
        var knot = scope.OptionParser.parse("boolValue:(strValue>converter.strToInt & dotValue>converter.dotsToInt)> areTheySame")[0];
        target1 = {strValue:"one", dotValue:".."};
        target2 = {boolValue:true};
        scope.AccessPointManager.tieKnot(target2, target1, knot);

        assert.equal(target1.strValue, "one");
        assert.equal(target1.dotValue, "..");
        assert.equal(target2.boolValue, false);


        target1.strValue = "two";
        assert.equal(target1.strValue, "two");
        assert.equal(target1.dotValue, "..");
        assert.equal(target2.boolValue, true);

        target1.dotValue = ".";
        assert.equal(target1.strValue, "two");
        assert.equal(target1.dotValue, ".");
        assert.equal(target2.boolValue, false);

        target1.strValue = "one";
        assert.equal(target1.strValue, "one");
        assert.equal(target1.dotValue, ".");
        assert.equal(target2.boolValue, true);

        scope.AccessPointManager.untieKnot(target2, target1, knot);
        target1.strValue = "two";
        assert.equal(target1.strValue, "two");
        assert.equal(target1.dotValue, ".");
        assert.equal(target2.boolValue, true);

    });
})();