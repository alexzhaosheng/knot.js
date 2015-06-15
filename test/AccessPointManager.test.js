(function(window){
    var scope = window.Knot.getPrivateScope();

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
                    testAp, "newly registered AP provider overwrite the previous providers");
        assert.equal(scope.AccessPointManager.getProvider(target1,"testAX"),
            apProvider, "newly registered AP provider overwrite the previous providers");
        assert.equal(scope.AccessPointManager.getProvider(target2,"value"),
            apProvider, "newly registered AP provider overwrite the previous providers");

        scope.AccessPointManager.unregisterAPProvider(testAp);
        scope.AccessPointManager.unregisterAPProvider(apProvider);

        target1.value = true;
        var knots = scope.OptionParser.parse("value>{return value?10:1;}:apOnData.intValue>{return value>2?true:false;}");
        knots[0].leftAP.provider = scope.AccessPointManager.getProvider(target1, knots[0].leftAP.description);
        knots[0].rightAP.provider = scope.AccessPointManager.getProvider(target2, knots[0].rightAP.description);
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target1, knots[0].leftAP),
                    10, "getValueThroughPipe works");
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].leftAP), 1, "getValueThroughPipe works");

        target2.apOnData = {intValue:1};
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].rightAP), false, "getValueThroughPipe works");
        target2.apOnData.intValue = 10;
        assert.equal(scope.AccessPointManager.getValueThroughPipe(target2, knots[0].rightAP), true, "getValueThroughPipe works");


        target1.value = false;
        scope.AccessPointManager.tieKnot(target1, target2, knots[0]);

        //initial value should be set from dataContext to element
        assert.equal(target1.value, true, "initial value should be set from right to left");
        assert.equal(target2.apOnData.intValue, 10, "initial value should be set  from right to left");

        target2.apOnData.intValue = 1;
        assert.equal(target1.value, false, "knot works");
        assert.equal(target2.apOnData.intValue, 1, "knot works");

        target2.apOnData.intValue = 10;
        assert.equal(target1.value, true, "knot works");
        assert.equal(target2.apOnData.intValue, 10, "knot works");

        target1.value = false;
        assert.equal(target1.value, false, "knot works");
        assert.equal(target2.apOnData.intValue, 1, "knot works");

        target1.value = true;
        assert.equal(target1.value, true, "knot works");
        assert.equal(target2.apOnData.intValue, 10, "knot works");


        scope.AccessPointManager.untieKnot(target1, target2, knots[0]);
        target1.value = false;
        assert.equal(target1.value, false, "untieKnot works");
        assert.equal(target2.apOnData.intValue, 10, "untieKnot works");

        target1.value = true;
        assert.equal(target1.value, true, "untieKnot works");
        assert.equal(target2.apOnData.intValue, 10, "untieKnot works");

        target2.apOnData.intValue = 1;
        assert.equal(target1.value, true, "untieKnot works");
        assert.equal(target2.apOnData.intValue, 1, "untieKnot works");


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
        scope.AccessPointManager.tieKnot(target1, target2, knots[0], "test pipes from global scope");

        assert.equal(target1.strValue, "one", "test pipes from global scope");
        assert.equal(target2.intValue, 1, "test pipes from global scope");
        assert.equal(target2, latestThisPointer, "test pipes from global scope");

        target2.intValue = 2;
        assert.equal(target1.strValue, "two", "test pipes from global scope");
        assert.equal(target2.intValue, 2, "test pipes from global scope");

        scope.AccessPointManager.untieKnot(target1, target2, knots[0]);


        //test multiple knots tied up to the same AP

        var knot1 = scope.OptionParser.parse("strValue>converter.strToInt:intValue>converter.intToString")[0];
        var knot2 = scope.OptionParser.parse("dotValue>converter.dotsToInt:intValue>converter.intToDots")[0];
        target2.intValue = 2;
        target1.strValue = "one";
        target3.dotValue = ".";
        scope.AccessPointManager.tieKnot(target1, target2, knot1);
        scope.AccessPointManager.tieKnot(target3, target2, knot2);

        assert.equal(target1.strValue, "two", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target3.dotValue, "..", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target2.intValue, 2, "test multiple knots tied up to the same AP, and become a chain");

        target1.strValue = "one";
        assert.equal(target1.strValue, "one", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target3.dotValue, ".", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target2.intValue, 1, "test multiple knots tied up to the same AP, and become a chain");

        target3.dotValue = "..";
        assert.equal(target1.strValue, "two", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target3.dotValue, "..", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target2.intValue, 2, "test multiple knots tied up to the same AP, and become a chain");

        target2.intValue = 1;
        assert.equal(target1.strValue, "one", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target3.dotValue, ".", "test multiple knots tied up to the same AP, and become a chain");
        assert.equal(target2.intValue, 1, "test multiple knots tied up to the same AP, and become a chain");

        scope.AccessPointManager.untieKnot(target1, target2, knot1);
        target3.dotValue = "..";
        assert.equal(target1.strValue, "one", "untie a part of the chain");
        assert.equal(target3.dotValue, "..", "untie a part of the chain");
        assert.equal(target2.intValue, 2, "untie a part of the chain");

        scope.AccessPointManager.untieKnot(target3, target2, knot2);
        target3.dotValue = ".";
        assert.equal(target1.strValue, "one", "untie the whole chain");
        assert.equal(target3.dotValue, ".", "untie the whole chain");
        assert.equal(target2.intValue, 2, "untie the whole chain");


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

        assert.equal(target1.strValue, "one", "tie with n to 1 pipe");
        assert.equal(target1.dotValue, "..", "tie with n to 1 pipe");
        assert.equal(target2.boolValue, false, "tie with n to 1 pipe");


        target1.strValue = "two";
        assert.equal(target1.strValue, "two", "tie with n to 1 pipe");
        assert.equal(target1.dotValue, "..", "tie with n to 1 pipe");
        assert.equal(target2.boolValue, true, "tie with n to 1 pipe");

        target1.dotValue = ".";
        assert.equal(target1.strValue, "two", "tie with n to 1 pipe");
        assert.equal(target1.dotValue, ".", "tie with n to 1 pipe");
        assert.equal(target2.boolValue, false, "tie with n to 1 pipe");

        target1.strValue = "one";
        assert.equal(target1.strValue, "one", "tie with n to 1 pipe");
        assert.equal(target1.dotValue, ".", "tie with n to 1 pipe");
        assert.equal(target2.boolValue, true, "tie with n to 1 pipe");

        scope.AccessPointManager.untieKnot(target2, target1, knot);
        target1.strValue = "two";
        assert.equal(target1.strValue, "two", "untie knot with n to 1 pipe");
        assert.equal(target1.dotValue, ".", "untie knot with n to 1 pipe");
        assert.equal(target2.boolValue, true, "untie knot with n to 1 pipe");


        var knot = scope.OptionParser.parse("count:list.length")[0];
        target1 = {count:0};
        target2 = {list:[1,2]};
        scope.AccessPointManager.tieKnot(target1, target2, knot);
        assert.equal(target1.count, 2, "tie to array length");
        target2.list.push(10);
        assert.equal(target2.list.length, 3, "tie to array length");
        assert.equal(target1.count, 3, "tie to array length");


        var knot = scope.OptionParser.parse('display:{return this.isVisible?"block":"none";}')[0];
        target1={display:""};
        target2={isVisible:true};
        scope.AccessPointManager.tieKnot(target1, target2, knot);
        assert.equal(target1.display, "block", "Directly tie to function");

        //todo: is binding to * really worthy to do?
        //target2.isVisible = false;
        //assert.equal(target1.display, "none", "Directly tie to function");

    });

    QUnit.test( "private.AccessPointerManager.knotEvent", function( assert ) {
        var target1, target2;
        var latestLeft, latestRight, latestChangedKnot, latestValue, latestIsFromLeftToRight, latestTarget,fireCount=0;

        window.accessPointerEventTest = {
            nameChanged: function(left, right, knot, value, isFromleftToRight){
                latestLeft = left;
                latestRight = right;
                latestChangedKnot = knot;
                latestValue= value;
                fireCount++;
            },
            valueSetForAP:function(apDescription, value){
                latestTarget = this; latestChangedKnot = apDescription; latestValue=value;
            },
            valueChangeForAP:function(ap, oldValue, newValue){
                latestTarget = this; latestChangedKnot = ap; latestValue = newValue;
            }
        }

        knot = scope.OptionParser.parse("value:name|@change:@/accessPointerEventTest.nameChanged")[0];
        target1 = {value: ""};
        target2 = {name: "satoshi"};
        scope.AccessPointManager.tieKnot(target1, target2, knot);
        assert.equal(target1.value, "satoshi", "Knot event works");
        assert.equal(latestLeft, target1, "Knot event works");
        assert.equal(latestRight, target2, "Knot event works");
        assert.equal(latestValue, "satoshi", "Knot event works");
        assert.equal(fireCount,1, "Knot event works");

        latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        fireCount=0;
        target2.name = "laozi";
        assert.equal(target1.value, "laozi", "Knot event works");
        assert.equal(latestLeft, target1, "Knot event works");
        assert.equal(latestRight, target2, "Knot event works");
        assert.equal(latestValue, "laozi", "Knot event works");
        assert.equal(fireCount,1, "Knot event works");

        latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        target1.value = "einstein";
        assert.equal(target2.name, "einstein", "Knot event works");
        assert.equal(latestLeft, target1, "Knot event works");
        assert.equal(latestRight, target2, "Knot event works");
        assert.equal(latestValue, "einstein", "Knot event works");


        latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        knot = scope.OptionParser.parse("value[@set:@/accessPointerEventTest.valueSetForAP]:name")[0];
        target1 = {value: ""};
        target2 = {name: "satoshi"};
        scope.AccessPointManager.tieKnot(target1, target2, knot);
        assert.equal(target1.value, "satoshi", "ap event @set works");
        assert.equal(latestTarget, target1, "ap event @set works");
        assert.equal(latestChangedKnot, "value", "ap event @set works");
        assert.equal(latestValue, "satoshi", "ap event @set works");

        latestTarget = latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        target2.name = "einstein";
        assert.equal(target1.value, "einstein", "ap event @set works");
        assert.equal(latestTarget, target1, "ap event @set works");
        assert.equal(latestChangedKnot, "value", "ap event @set works");
        assert.equal(latestValue, "einstein", "ap event @set works");

        latestTarget = latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        target1.value = "laozi";
        assert.equal(target2.name, "laozi", "ap event @set works");
        assert.equal(latestTarget, undefined, "ap event @set works");

        latestLeft=latestRight=latestValue=latestChangedKnot=latestIsFromLeftToRight=undefined;
        knot = scope.OptionParser.parse("value[@change:@/accessPointerEventTest.valueChangeForAP]:name")[0];
        target1 = {value: ""};
        target2 = {name: "satoshi"};
        scope.AccessPointManager.tieKnot(target1, target2, knot);
        assert.equal(target1.value, "satoshi", "ap event @change works");
        assert.equal(latestTarget, null, "ap event @change works");

        target1.value = "laozi";
        assert.equal(target2.name, "laozi", "ap event @change works");
        assert.equal(latestTarget, target1, "ap event @change works");
        assert.equal(latestChangedKnot, "value", "ap event @change works");
        assert.equal(latestValue, "laozi", "ap event @change works");

    });
})((function() {
        return this;
    })());