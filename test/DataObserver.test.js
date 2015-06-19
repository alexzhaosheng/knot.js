(function(window){
    var scope = window.Knot.getPrivateScope();

    QUnit.test( "private.DataObserver: Event Manager", function( assert ) {
        var data1 = {}, data2 = {};

        var propertyName = null;
        var changedData = null;
        var oldData=null, newData = null
        var onSexChanged = function(p, o, n){
            propertyName = p;
            oldData = o; newData = n;
            changedData = this;
        }
        var onNameChanged = function(n){
            propertyName = n;
            changedData = this;
        }
        var testAttachedData= {};
        scope.DataObserver.on(data1, "sex", onSexChanged, testAttachedData);
        scope.DataObserver.notifyDataChanged(data1, "sex", "m", "f");
        scope.DataObserver.notifyDataChanged(data1, "name");
        scope.DataObserver.notifyDataChanged(data2, "sex");

        assert.equal(propertyName, "sex", "property name is correct in change event");
        assert.equal(oldData, "m", "old value is correct in change event");
        assert.equal(newData, "f", "new value is correct in change event");
        assert.equal(changedData, data1, "this pointer is correct in change event");

        assert.equal(scope.DataObserver.hasRegistered(data1, "sex", onSexChanged), true, "'sex' change event has been registered to data1 with callback onSexChanged");
        assert.equal(scope.DataObserver.hasRegistered(data1, "sex", onNameChanged), false, "'sex' change event has not been registered to data1 with onNameChanged");
        assert.equal(scope.DataObserver.hasRegistered(data2, "sex", onSexChanged), false, "'sex' change event has not been registered to data2 with onSexChanged");
        assert.equal(scope.DataObserver.hasRegistered(data1, "name", onSexChanged), false, "'name' change event has not been registered to data1 with onNameChanged");

        assert.equal(scope.DataObserver.getAttachedData(data1, "sex", onSexChanged), testAttachedData, "getAttachedData gets the correct result");

        assert.equal(scope.DataObserver.getPropertiesChangeRecords(data1).indexOf("sex")>=0, true, "getPropertiesChangeRecords gets the correct records");
        assert.equal(scope.DataObserver.getPropertiesChangeRecords(data1).indexOf("name")>=0, true, "getPropertiesChangeRecords gets the correct records");
        assert.equal(scope.DataObserver.getPropertiesChangeRecords(data1).length, 2, "getPropertiesChangeRecords gets the correct records");

        scope.DataObserver.clearPropertiesChangeRecords(data1);
        assert.equal(scope.DataObserver.getPropertiesChangeRecords(data1).length, 0,"clearPropertiesChangeRecords does it's work");

        scope.DataObserver.off(data1, "sex", onSexChanged);

        assert.equal(scope.DataObserver.hasRegistered(data1,  "sex", onSexChanged), false, "off does it's work");
        propertyName = null;
        changedData = null;
        scope.DataObserver.notifyDataChanged(data1, "name");
        assert.equal(propertyName, null, "off does it's work");
        assert.equal(changedData, null, "off does it's work");



        var onAnyPropertiesChanged = function(n){
            propertyName = n;
            changedData = this;
        };

        scope.DataObserver.on(data1, "*", onAnyPropertiesChanged);
        scope.DataObserver.notifyDataChanged(data1, "sex");
        assert.equal(propertyName, "sex","registering to * works");
        scope.DataObserver.notifyDataChanged(data1, "name");
        assert.equal(propertyName, "name", "registering to * works");
    });

    QUnit.test( "private.DataObserver: Property Hook", function( assert ) {
        var testObject= {name:"Satoshi"};


        scope.DataObserver.hookProperty(testObject, "name");

        var propertyName, changedData, oldData, newData;
        scope.DataObserver.on(testObject, "*", function(p, o, n){
            propertyName = p;
            changedData = this;
            oldData = o;
            newData = n;
        });

        testObject.name = "Alex";

        assert.equal(propertyName, "name", "property hook works");
        assert.equal(changedData, testObject, "property hook works");
        assert.equal(oldData, "Satoshi", "property hook works");
        assert.equal(newData, "Alex", "property hook works");
        assert.equal(testObject.name, "Alex", "property hook works");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Alex"}), "property hook doesn't change the JSON result");

        assert.equal(scope.DataObserver.hasHookedProperty(testObject, "name"), true, "hasHookedProperty returns the correct result");

        scope.DataObserver.unhookProperty(testObject, "name");
        assert.equal(scope.DataObserver.hasHookedProperty(testObject, "name"), false, "hasHookedProperty returns the correct result");
        assert.equal(testObject.name, "Alex", "unhookProperty restore the value when removing the hook");
        propertyName = changedData = null;

        testObject.name = "Tom";

        assert.equal(propertyName, null, "unhookProperty does work");
        assert.equal(changedData, null, "unhookProperty does work");
        assert.equal(testObject.name, "Tom", "unhookProperty does work");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Tom"}), "unhookProperty doesn't change the JSON result");

        //test the ref count for hooking property
        scope.DataObserver.hookProperty(testObject, "name");
        scope.DataObserver.hookProperty(testObject, "name");
        assert.equal(scope.DataObserver.hasHookedProperty(testObject, "name"), true, "test ref count for hook. first make sure it is hooked");
        scope.DataObserver.unhookProperty(testObject, "name");
        assert.equal(scope.DataObserver.hasHookedProperty(testObject, "name"), true, "remove a hook reference, hook is still there");
        scope.DataObserver.unhookProperty(testObject, "name");
        assert.equal(scope.DataObserver.hasHookedProperty(testObject, "name"), false, "remove the last hook reference, hook is gone");


        //if set the same value, data change event should not be raised.
        testObject.name = "Alex";
        propertyName = changedData = null;
        scope.DataObserver.hookProperty(testObject, "name");
        testObject.name = "Alex";
        assert.equal(propertyName, null, "change event is not raised");
        assert.equal(changedData, null, "change event is not raised");
    });


    QUnit.test( "private.DataObserver: Object Monitor", function( assert ) {
        var testObject= {name:"Satoshi"};

        var propertyName = null;
        var changedData = null;
        var oldData=null, newData = null;
        var dataChangedRaised = false;
        var dataChangedRaisedCount = 0;
        var resetTest = function(){
            testObject= {name:"Satoshi"};
            dataChangedRaised=  false;
            dataChangedRaisedCount = 0;
            propertyName = changedData = oldData = newData = undefined;
        };
        var onDataChanged = function(p, o, n){
            if(propertyName){
                if(propertyName instanceof  Array){
                    propertyName.push(p)
                    oldData.push(o);
                    newData.push(n);
                    changedData.push(this);
                }
                else{
                    propertyName=[propertyName, p];
                    oldData = [oldData, o];
                    newData = [newData, n];
                    changedData = [changedData, this];
                }
            }
            else{
                propertyName = p;
                oldData = o;
                newData = n;
                changedData = this;
            }
            dataChangedRaised = true;
            dataChangedRaisedCount ++;
        }
        scope.DataObserver.monitor(testObject, "name", onDataChanged);

        testObject.name = "alex";
        testObject.group = "a";
        assert.equal(propertyName, "name", "monitoring simple path works");
        assert.equal(changedData, testObject, "monitoring simple path works");
        assert.equal(oldData, "Satoshi", "monitoring simple path works");
        assert.equal(newData, "alex", "monitoring simple path works");

        resetTest();
        scope.DataObserver.stopMonitoring(testObject, "name", onDataChanged);
        testObject.name = "tony";
        testObject.group = "b";
        assert.equal(propertyName, null, "stopMonitoring works");
        assert.equal(changedData, null, "stopMonitoring works");
        assert.equal(oldData, null, "stopMonitoring works");
        assert.equal(newData, null, "stopMonitoring works");


        resetTest();
        scope.DataObserver.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = {postCode:1234};
        assert.equal(propertyName, "address.postCode", "monitoring composite path and changing the whole object on the path other than changing a property on object");
        assert.equal(dataChangedRaisedCount, 1, "monitoring composite path and changing the whole object on the path other than changing a property on object");
        assert.equal(changedData, testObject, "monitoring composite path and changing the whole object on the path other than changing a property on object");
        assert.equal(oldData, null, "monitoring composite path and changing the whole object on the path other than changing a property on object");
        assert.equal(newData, 1234, "monitoring composite path and changing the whole object on the path other than changing a property on object");
        scope.DataObserver.stopMonitoring(testObject,"address.postCode", onDataChanged);

        resetTest();
        scope.DataObserver.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = {};
        testObject.address.postCode = 5678;
        assert.equal(dataChangedRaised, true, "change event is raised");
        assert.equal(dataChangedRaisedCount, 2, "change event is raised for 2 times");
        assert.equal(propertyName[0], "address.postCode", "change event is correctly raised");
        assert.equal(propertyName[1], "address.postCode", "change event is correctly raised");
        assert.equal(changedData[1], testObject, "change event is correctly raised");
        assert.equal(oldData[0], null, "change event is correctly raised");
        assert.equal(oldData[1], null, "change event is correctly raised");
        assert.equal(newData[0], null, "change event is correctly raised");
        assert.equal(newData[1], 5678, "change event is correctly raised");

        var oldAddressObj = testObject.address;
        var knotAttached = scope.AttachedData.getAttachedInfo(oldAddressObj);
        assert.equal(knotAttached.changedCallbacks["postCode"].length, 1, "test automatically object monitoring setup. make sure current object is correctly monitored");
        assert.equal(scope.DataObserver.hasHookedProperty(oldAddressObj, "postCode"), true, "test automatically object monitoring setup. make sure current object is correctly monitored");

        testObject.address = {postCode:9999};
        assert.equal(dataChangedRaisedCount, 3,"test automatically object monitoring setup. check whether the event is raised for the new object");
        assert.equal(propertyName[2], "address.postCode", "test automatically object monitoring setup. check whether the event is raised for the new object");
        assert.equal(changedData[2], testObject, "test automatically object monitoring setup. check whether the event is raised for the new object");
        assert.equal(oldData[2], 5678, "test automatically object monitoring setup. check whether the event is raised for the new object");
        assert.equal(newData[2], 9999, "test automatically object monitoring setup. check whether the event is raised for the new object");
        testObject.address.postCode = 4321;
        assert.equal(dataChangedRaisedCount, 4,"test automatically object monitoring setup. check whether the event is raised for the new object");
        assert.equal(newData[3], 4321, "test automatically object monitoring setup. check whether the event is raised for the new object");

        var knotAttached = scope.AttachedData.getAttachedInfo(oldAddressObj);
        assert.equal(typeof(knotAttached.changedCallbacks["postCode"]), "undefined", "test automatically object monitoring setup. check whether old object is correctly cleared");
        assert.equal(scope.DataObserver.hasHookedProperty(oldAddressObj, "postCode"), false, "test automatically object monitoring setup. check whether old object is correctly cleared");
        assert.equal(dataChangedRaisedCount, 4, "test automatically object monitoring setup. check whether old object is correctly cleared");
        oldAddressObj.postCode = 9000;
        assert.equal(dataChangedRaisedCount, 4, "test automatically object monitoring setup. check whether old object is correctly cleared");


        resetTest();
        scope.DataObserver.monitor(testObject, "address.postCode", onDataChanged);
        scope.DataObserver.monitor(testObject, "address.location.street", onDataChanged);
        testObject.address = {postCode: 4321, location:{street:"box avenue", state:"queensland"}};
        assert.equal(dataChangedRaised, true, "test multiple monitor on the same object (address)");
        assert.equal(dataChangedRaisedCount, 2, "test multiple monitor on the same object (address)");
        assert.equal(propertyName.indexOf("address.postCode")>=0, true, "test multiple monitor on the same object (address)");
        assert.equal(propertyName.indexOf("address.location.street")>=0, true, "test multiple monitor on the same object (address)");
        testObject.address.location.street = "dane court";
        assert.equal(dataChangedRaisedCount, 3, "test multiple monitor on the same object (address)");
        assert.equal(propertyName[2], "address.location.street", "test multiple monitor on the same object (address)");
        assert.equal(oldData[2], "box avenue", "test multiple monitor on the same object (address)");
        assert.equal(newData[2], "dane court", "test multiple monitor on the same object (address)");

        scope.DataObserver.stopMonitoring(testObject, "address.location.street", onDataChanged);
        testObject.address.location.street = "beagle street";
        assert.equal(dataChangedRaisedCount, 3, "test multiple monitor on the same object (address), remove one monitor");

        testObject.address.postCode = 9876;
        assert.equal(dataChangedRaisedCount, 4, "test multiple monitor on the same object (address), remove one monitor, and the other still works");
        assert.equal(newData[3], 9876, "test multiple monitor on the same object (address), remove one monitor, and the other still works");


        resetTest();
        testObject = {};
        scope.DataObserver.monitor(testObject, "test", onDataChanged);
        var objectChangedCount = 0;
        var propertyNameGetWhenMonitoringAnyChanges;
        scope.DataObserver.monitor(testObject, "*", function(p){objectChangedCount++;propertyNameGetWhenMonitoringAnyChanges=p;});
        testObject.test = "ttt";
        assert.equal(propertyName, "test","monitor * (any change of the object)");
        assert.equal(propertyNameGetWhenMonitoringAnyChanges, "test","monitor * (any change of the object)");
        assert.equal(objectChangedCount, 1,"monitor * (any change of the object)");

        resetTest();
        window.testData = {name:"test"};;
        scope.DataObserver.monitor(null, "/testData.name", onDataChanged);

        window.testData.name = "alex";
        assert.equal(propertyName, "testData.name", "monitor absolute path");
        assert.equal(changedData, window, "monitor absolute path");
        assert.equal(oldData, "test", "monitor absolute path");
        assert.equal(newData, "alex", "monitor absolute path");

        resetTest();
        scope.DataObserver.monitor(null, "/anotherTestObject.name", onDataChanged);
        window.anotherTestObject = {name:"alex"};
        assert.equal(dataChangedRaised, true, "monitor absolute path");
        assert.equal(changedData, window, "monitor absolute path");
        assert.equal(propertyName, "anotherTestObject.name", "monitor absolute path");
        assert.equal(typeof(oldData), "undefined", "monitor absolute path");
        assert.equal(newData, "alex", "monitor absolute path");



        resetTest();
        scope.DataObserver.stopMonitoring(null,"/anotherTestObject.name", onDataChanged);
        window.anotherTestObject.name = "tom";
        assert.equal(dataChangedRaised, false, "stop monitoring absolute path");


        resetTest();
        testObject = {address:{postCode:123}};
        scope.DataObserver.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = null;
        assert.equal(dataChangedRaised, true, "monitor works with null object");
        assert.equal(propertyName, "address.postCode", "monitor works with null object");
        assert.equal(oldData, 123, "monitor works with null object");
        assert.equal(typeof(newData), "undefined", "monitor works with null object");


        //array change
        resetTest();
        scope.DataObserver.monitor(null, "/anotherTestObject.arrayObj", onDataChanged);
        window.anotherTestObject = {arrayObj:[]};
        assert.equal(dataChangedRaised, true, "monitoring array object, raise the change event when only array it-self is changed");
        resetTest();
        window.anotherTestObject.arrayObj.push("test");
        assert.equal(dataChangedRaised, true, "monitoring array object, raise the change event when only array it-self is changed");

        resetTest();
        scope.DataObserver.stopMonitoring(null, "/anotherTestObject.arrayObj", onDataChanged);
        window.anotherTestObject.arrayObj.push("test2");
        assert.equal(dataChangedRaised, false, "stop monitoring array object");

        resetTest();
        scope.DataObserver.monitor(window.anotherTestObject.arrayObj, "length", onDataChanged);
        window.anotherTestObject.arrayObj.push("test3");
        assert.equal(dataChangedRaised, true, "monitoring array length");
        assert.equal(propertyName, "length", "monitoring array length");

    });
})((function() {
        return this;
    })());