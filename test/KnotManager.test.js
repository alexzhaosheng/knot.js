(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();

    var TestAccessPointerProvider = function (supportTarget, apName) {
        this.supportTarget = supportTarget;
        this.apName = apName;
    };
    TestAccessPointerProvider.prototype.doesSupport = function (target, apName) {
        if(this.supportTarget) {
            return target === this.supportTarget && this.apName === apName;
        }
        return true;
    };
    TestAccessPointerProvider.prototype.getValue = function (target, apName) {
        return scope.Utility.getValueOnPath(target, apName);
    };
    TestAccessPointerProvider.prototype.setValue = function (target, apName, value) {
        return scope.Utility.setValueOnPath(target, apName, value);
    };
    TestAccessPointerProvider.prototype.doesSupportMonitoring = function (target, apName) {
        return true;
    };
    TestAccessPointerProvider.prototype.monitor = function (target, apName, callback) {
        scope.DataObserver.monitor(target, apName, callback);
    };
    TestAccessPointerProvider.prototype.stopMonitoring = function (target, apName, callback) {
        scope.DataObserver.stopMonitoring(target, apName, callback);
    };



    global.QUnit.test( "private.AccessPointerManager", function ( assert ) {
        var target1={}, target2={}, target3={};

        var apProvider = new TestAccessPointerProvider();
        scope.KnotManager.registerAPProvider(apProvider);
        var testAp = new TestAccessPointerProvider(target1, "value");
        scope.KnotManager.registerAPProvider(testAp);

        assert.equal(scope.KnotManager.getProvider(target1,"value"),
                    testAp, "newly registered AP provider overwrite the previous providers");
        assert.equal(scope.KnotManager.getProvider(target1,"testAX"),
            apProvider, "newly registered AP provider overwrite the previous providers");
        assert.equal(scope.KnotManager.getProvider(target2,"value"),
            apProvider, "newly registered AP provider overwrite the previous providers");

        scope.KnotManager.unregisterAPProvider(testAp);
        scope.KnotManager.unregisterAPProvider(apProvider);

        target1.value = true;
        var knots = scope.OptionParser.parse("value>{return value?10:1;}:apOnData.intValue>{return value>2?true:false;}");
        knots[0].leftAP.provider = scope.KnotManager.getProvider(target1, knots[0].leftAP.description);
        knots[0].rightAP.provider = scope.KnotManager.getProvider(target2, knots[0].rightAP.description);
        assert.equal(scope.KnotManager.getValueThroughPipe(target1, knots[0].leftAP),
                    10, "getValueThroughPipe works");
        assert.equal(scope.KnotManager.getValueThroughPipe(target2, knots[0].leftAP), 1, "getValueThroughPipe works");

        target2.apOnData = {intValue:1};
        assert.equal(scope.KnotManager.getValueThroughPipe(target2, knots[0].rightAP), false, "getValueThroughPipe works");
        target2.apOnData.intValue = 10;
        assert.equal(scope.KnotManager.getValueThroughPipe(target2, knots[0].rightAP), true, "getValueThroughPipe works");


        target1.value = false;
        scope.KnotManager.tieKnot(target1, target2, knots[0]);

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


        scope.KnotManager.untieKnot(target1, target2, knots[0]);
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
        global.converter = {
            intToString: function (value) {
                latestThisPointer = this;
                switch (value) {
                    case 1:
                        return "one";
                    case 2:
                        return "two";
                    default:
                        throw new Error("Unknow number:"+value);
                }
             },
            strToInt: function (value) {
                switch (value) {
                    case "one":
                        return 1;
                    case "two":
                        return 2;
                    default:
                        throw new Error("Unknow number:"+value);
                }
            },
            dotsToInt: function (value) {
                return value.length;
            },
            intToDots: function (value) {
                var f = "";
                for(var i=0;i<value;i++) {
                    f += ".";
                }
                return f;
            }
        };

        knots = scope.OptionParser.parse("strValue>converter.strToInt:intValue>converter.intToString");
        target2 = {intValue: 1};
        target1 = {strValue: ""};
        scope.KnotManager.tieKnot(target1, target2, knots[0], "test pipes from global scope");

        assert.equal(target1.strValue, "one", "test pipes from global scope");
        assert.equal(target2.intValue, 1, "test pipes from global scope");
        assert.equal(target2, latestThisPointer, "test pipes from global scope");

        target2.intValue = 2;
        assert.equal(target1.strValue, "two", "test pipes from global scope");
        assert.equal(target2.intValue, 2, "test pipes from global scope");

        scope.KnotManager.untieKnot(target1, target2, knots[0]);


        //test multiple knots tied up to the same AP

        var knot1 = scope.OptionParser.parse("strValue>converter.strToInt:intValue>converter.intToString")[0];
        var knot2 = scope.OptionParser.parse("dotValue>converter.dotsToInt:intValue>converter.intToDots")[0];
        target2.intValue = 2;
        target1.strValue = "one";
        target3.dotValue = ".";
        scope.KnotManager.tieKnot(target1, target2, knot1);
        scope.KnotManager.tieKnot(target3, target2, knot2);

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

        scope.KnotManager.untieKnot(target1, target2, knot1);
        target3.dotValue = "..";
        assert.equal(target1.strValue, "one", "untie a part of the chain");
        assert.equal(target3.dotValue, "..", "untie a part of the chain");
        assert.equal(target2.intValue, 2, "untie a part of the chain");

        scope.KnotManager.untieKnot(target3, target2, knot2);
        target3.dotValue = ".";
        assert.equal(target1.strValue, "one", "untie the whole chain");
        assert.equal(target3.dotValue, ".", "untie the whole chain");
        assert.equal(target2.intValue, 2, "untie the whole chain");


        global.areTheySame = function (values) {
            for(var i=1; i< values.length; i++) {
                if(values[i-1] !== values[i]) {
                    return false;
                }
            }
            return true;
        };

        //test composite AP
        var knot = scope.OptionParser.parse("boolValue:(strValue>converter.strToInt & dotValue>converter.dotsToInt)> areTheySame")[0];
        target1 = {strValue:"one", dotValue:".."};
        target2 = {boolValue:true};
        scope.KnotManager.tieKnot(target2, target1, knot);

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

        scope.KnotManager.untieKnot(target2, target1, knot);
        target1.strValue = "two";
        assert.equal(target1.strValue, "two", "untie knot with n to 1 pipe");
        assert.equal(target1.dotValue, ".", "untie knot with n to 1 pipe");
        assert.equal(target2.boolValue, true, "untie knot with n to 1 pipe");


        knot = scope.OptionParser.parse("text:(name & sex) > @{return this.name+','+this.sex;}")[0];
        target1 = {text:""};
        target2 = {name:"laozi", sex:"m"};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.text, "laozi,m", "test this pointer in n to 1 binding");



        knot = scope.OptionParser.parse("count:list.length")[0];
        target1 = {count:0};
        target2 = {list:[1,2]};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.count, 2, "tie to array length");
        target2.list.push(10);
        assert.equal(target2.list.length, 3, "tie to array length");
        assert.equal(target1.count, 3, "tie to array length");


        knot = scope.OptionParser.parse('content:organization.leader.*')[0];
        target1={content:null};
        target2={organization:{leader:{name:"satoshi"}}};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.content, target2.organization.leader, "Tie to *");
        assert.equal(target1.content["*"], undefined, "Tie to *");
        target2.organization.leader = {name:"laozi"};
        assert.equal(target1.content, target2.organization.leader, "Tie to *");
        assert.equal(target1.content["*"], undefined, "Tie to *");

        knot = scope.OptionParser.parse('content:*')[0];
        target1={content:null};
        target2={name:"satoshi"};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.content, target2, "Tie to *");
    });

    global.QUnit.test( "private.AccessPointerManager.knotEvent", function ( assert ) {
        var target1, target2;
        var  latestChangedKnot, latestValue,  latestTarget;

        global.accessPointerEventTest = {
            valueSetForAP: function (apDescription, value) {
                latestTarget = this; latestChangedKnot = apDescription; latestValue=value;
            },
            valueChangeForAP: function (ap, oldValue, newValue) {
                latestTarget = this; latestChangedKnot = ap; latestValue = newValue;
            }
        };


        latestTarget=latestValue=latestChangedKnot=undefined;
        var knot = scope.OptionParser.parse("value[@set:@/accessPointerEventTest.valueSetForAP]:name")[0];
        target1 = {value: ""};
        target2 = {name: "satoshi"};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.value, "satoshi", "ap event @set works");
        assert.equal(latestTarget, target1, "ap event @set works");
        assert.equal(latestChangedKnot, "value", "ap event @set works");
        assert.equal(latestValue, "satoshi", "ap event @set works");

        latestTarget=latestValue=latestChangedKnot=undefined;
        target2.name = "einstein";
        assert.equal(target1.value, "einstein", "ap event @set works");
        assert.equal(latestTarget, target1, "ap event @set works");
        assert.equal(latestChangedKnot, "value", "ap event @set works");
        assert.equal(latestValue, "einstein", "ap event @set works");

        latestTarget=latestValue=latestChangedKnot=undefined;
        target1.value = "laozi";
        assert.equal(target2.name, "laozi", "ap event @set works");
        assert.equal(latestTarget, undefined, "ap event @set works");

        latestTarget=latestValue=latestChangedKnot=undefined;
        knot = scope.OptionParser.parse("value[@change:@/accessPointerEventTest.valueChangeForAP]:name")[0];
        target1 = {value: ""};
        target2 = {name: "satoshi"};
        scope.KnotManager.tieKnot(target1, target2, knot);
        assert.equal(target1.value, "satoshi", "ap event @change works");
        assert.equal(latestTarget, null, "ap event @change works");

        target1.value = "laozi";
        assert.equal(target2.name, "laozi", "ap event @change works");
        assert.equal(latestTarget, target1, "ap event @change works");
        assert.equal(latestChangedKnot, "value", "ap event @change works");
        assert.equal(latestValue, "laozi", "ap event @change works");
    });

    global.QUnit.test( "private.AccessPointerManager.target modifier", function ( assert ) {
        var target1, target2;

        var knot = scope.OptionParser.parse("valueCopy:*LEFT.value>{return value+', copy';}")[0];
        target1 = {value: "knot.js", valueCopy:""};
        scope.KnotManager.tieKnot(target1, null,  knot);
        assert.equal(target1.value,"knot.js", "target modifier works");
        assert.equal(target1.valueCopy,"knot.js, copy", "target modifier works");
        target1.value = "good";
        assert.equal(target1.value,"good", "target modifier works");
        assert.equal(target1.valueCopy,"good, copy", "target modifier works");
        target1.valueCopy = "set copy";
        assert.equal(target1.value,"set copy", "target modifier works");
        assert.equal(target1.valueCopy,"set copy", "target modifier works");

        knot = scope.OptionParser.parse("*RIGHT.value>{return value+', copy';}:valueCopy")[0];
        target1 = {value: "knot.js", valueCopy:""};
        target2 = {name: "satoshi"};
        scope.KnotManager.tieKnot(target2, target1,  knot);
        assert.equal(target1.value,"", "target modifier works");
        assert.equal(target1.valueCopy,"", "target modifier works");
        target1.value = "good";
        assert.equal(target1.value,"good", "target modifier works");
        assert.equal(target1.valueCopy,"good, copy", "target modifier works");
        target1.valueCopy = "set copy";
        assert.equal(target1.value,"set copy", "target modifier works");
        assert.equal(target1.valueCopy,"set copy", "target modifier works");

        knot = scope.OptionParser.parse("value:*LEFT.value>{return value+', copy';}")[0];
        target1 = {value: "knot.js", valueCopy:""};
        scope.KnotManager.tieKnot(target1, null,  knot);
        assert.equal(target1.value,"knot.js, copy", "use target modifier to bind to itself won't cause any problem");
    });

    })(window);