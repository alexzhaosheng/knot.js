(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.DataMonitor: Event Manager", function( assert ) {
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
        scope.DataMonitor.register(data1, "sex", onSexChanged, testAttachedData);
        scope.DataMonitor.notifyDataChanged(data1, "sex", "m", "f");
        scope.DataMonitor.notifyDataChanged(data1, "name");
        scope.DataMonitor.notifyDataChanged(data2, "sex");

        assert.equal("sex", propertyName);
        assert.equal("m", oldData);
        assert.equal("f", newData);
        assert.equal(data1, changedData);

        assert.equal(true, scope.DataMonitor.hasRegistered(data1, "sex", onSexChanged));
        assert.equal(false, scope.DataMonitor.hasRegistered(data1, "sex", onNameChanged));
        assert.equal(false, scope.DataMonitor.hasRegistered(data2, "sex", onSexChanged));
        assert.equal(false, scope.DataMonitor.hasRegistered(data1, "name", onSexChanged));

        assert.equal(scope.DataMonitor.getAttachedData(data1, "sex", onSexChanged), testAttachedData);

        assert.equal(true, scope.DataMonitor.getPropertyChangeRecord(data1).indexOf("sex")>=0);
        assert.equal(true, scope.DataMonitor.getPropertyChangeRecord(data1).indexOf("name")>=0);
        assert.equal(2, scope.DataMonitor.getPropertyChangeRecord(data1).length);

        scope.DataMonitor.resetPropertyChangeRecord(data1);
        assert.equal(0, scope.DataMonitor.getPropertyChangeRecord(data1).length);

        scope.DataMonitor.unregister(data1, "sex", onSexChanged);

        propertyName = null;
        changedData = null;
        scope.DataMonitor.notifyDataChanged(data1, "name");
        assert.equal(null, propertyName);
        assert.equal(null, changedData);

        assert.equal(false, scope.DataMonitor.hasRegistered(data1,  "sex", onSexChanged));



        var onAnyPropertiesChanged = function(n){
            propertyName = n;
            changedData = this;
        };

        scope.DataMonitor.register(data1, "*", onAnyPropertiesChanged);
        scope.DataMonitor.notifyDataChanged(data1, "sex");
        assert.equal("sex", propertyName);
        scope.DataMonitor.notifyDataChanged(data1, "name");
        assert.equal("name", propertyName);
    });

    QUnit.test( "private.DataMonitor: Property Hook", function( assert ) {
        var testObject= {name:"Satoshi"};


        scope.DataMonitor.hookProperty(testObject, "name");

        var propertyName, changedData, oldData, newData;
        scope.DataMonitor.register(testObject, "*", function(p, o, n){
            propertyName = p;
            changedData = this;
            oldData = o;
            newData = n;
        });

        testObject.name = "Alex";

        assert.equal(propertyName, "name");
        assert.equal(changedData, testObject);
        assert.equal(oldData, "Satoshi");
        assert.equal(newData, "Alex");
        assert.equal(testObject.name, "Alex");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Alex"}));

        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), true);

        scope.DataMonitor.unhookProperty(testObject, "name");
        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), false);
        assert.equal(testObject.name, "Alex");
        propertyName = changedData = null;

        testObject.name = "Tom";

        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(testObject.name, "Tom");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Tom"}));

        //test the ref count for hooking property
        scope.DataMonitor.hookProperty(testObject, "name");
        scope.DataMonitor.hookProperty(testObject, "name");
        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), true);
        scope.DataMonitor.unhookProperty(testObject, "name");
        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), true);
        scope.DataMonitor.unhookProperty(testObject, "name");
        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), false);


        //if set the same value, data change event should not be raised.
        testObject.name = "Alex";
        propertyName = changedData = null;
        scope.DataMonitor.hookProperty(testObject, "name");
        testObject.name = "Alex";
        assert.equal(propertyName, null);
        assert.equal(changedData, null);
    });


    QUnit.test( "private.DataMonitor: Object Monitor", function( assert ) {
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
        scope.DataMonitor.monitor(testObject, "name", onDataChanged);

        testObject.name = "alex";
        testObject.group = "a";
        assert.equal(propertyName, "name");
        assert.equal(changedData, testObject);
        assert.equal(oldData, "Satoshi");
        assert.equal(newData, "alex");

        resetTest();
        scope.DataMonitor.stopMonitoring(testObject, "name", onDataChanged);
        testObject.name = "tony";
        testObject.group = "b";
        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(oldData, null);
        assert.equal(newData, null);


        resetTest();
        scope.DataMonitor.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = {postCode:1234};
        assert.equal(propertyName, "address.postCode");
        assert.equal(dataChangedRaisedCount, 1);
        assert.equal(changedData, testObject);
        assert.equal(oldData, null);
        assert.equal(newData, 1234);

        resetTest();
        scope.DataMonitor.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = {};
        testObject.address.postCode = 5678;
        assert.equal(dataChangedRaised, true);
        assert.equal(dataChangedRaisedCount, 2);
        assert.equal(propertyName[0], "address.postCode");
        assert.equal(propertyName[1], "address.postCode");
        assert.equal(changedData[1], testObject);
        assert.equal(oldData[0], null);
        assert.equal(oldData[1], null);
        assert.equal(newData[0], null);
        assert.equal(newData[1], 5678);

        var oldAddressObj = testObject.address;
        var knotAttached = scope.AttachedData.getAttachedInfo(oldAddressObj);
        assert.equal(knotAttached.changedCallbacks["postCode"].length, 1);
        assert.equal(scope.DataMonitor.hasHookedProperty(oldAddressObj, "postCode"), true);

        testObject.address = {postCode:9999};
        assert.equal(dataChangedRaisedCount, 3);
        assert.equal(propertyName[2], "address.postCode");
        assert.equal(changedData[2], testObject);
        assert.equal(oldData[2], 5678);
        assert.equal(newData[2], 9999);

        var knotAttached = scope.AttachedData.getAttachedInfo(oldAddressObj);
        assert.equal(typeof(knotAttached.changedCallbacks["postCode"]), "undefined");
        assert.equal(scope.DataMonitor.hasHookedProperty(oldAddressObj, "postCode"), false);
        assert.equal(dataChangedRaisedCount, 3);
        oldAddressObj.postCode = 9000;
        assert.equal(dataChangedRaisedCount, 3);


        resetTest();
        scope.DataMonitor.monitor(testObject, "address.postCode", onDataChanged);
        scope.DataMonitor.monitor(testObject, "address.location.street", onDataChanged);
        testObject.address = {postCode: 4321, location:{street:"box avenue", state:"queensland"}};
        assert.equal(dataChangedRaised, true);
        assert.equal(dataChangedRaisedCount, 2);
        assert.equal(propertyName.indexOf("address.postCode")>=0, true);
        assert.equal(propertyName.indexOf("address.location.street")>=0, true);
        testObject.address.location.street = "dane court";
        assert.equal(dataChangedRaisedCount, 3);
        assert.equal(propertyName[2], "address.location.street");
        assert.equal(oldData[2], "box avenue");
        assert.equal(newData[2], "dane court");

        scope.DataMonitor.stopMonitoring(testObject, "address.location.street", onDataChanged);
        testObject.address.location.street = "beagle street";
        assert.equal(dataChangedRaisedCount, 3);
    });
})();