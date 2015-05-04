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
        scope.DataMonitor.register(data1, "sex", onSexChanged);
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

        scope.DataMonitor.unhookProperties(testObject);
        assert.equal(scope.DataMonitor.hasHookedProperty(testObject, "name"), false);
        propertyName = changedData = null;

        testObject.name = "Tom";

        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(testObject.name, "Tom");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Tom"}));
    });


    QUnit.test( "private.DataMonitor: Object Monitor", function( assert ) {
        var testObject= {name:"Satoshi"};

        var propertyName = null;
        var changedData = null;
        var oldData=null, newData = null
        var onDataChanged = function(p, o, n){
            propertyName = p;
            oldData = o; newData = n;
            changedData = this;
        }
        scope.DataMonitor.monitor(testObject, "name", onDataChanged);

        testObject.name = "alex";
        testObject.group = "a";
        assert.equal(propertyName, "name");
        assert.equal(changedData, testObject);
        assert.equal(oldData, "Satoshi");
        assert.equal(newData, "alex");

        propertyName = changedData = oldData=newData=null;
        scope.DataMonitor.stopMonitoringObject(testObject, "name", onDataChanged);
        testObject.name = "tony";
        testObject.group = "b";
        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(oldData, null);
        assert.equal(newData, null);


        propertyName = changedData = oldData=newData=null;
        scope.DataMonitor.monitor(testObject, "address.postCode", onDataChanged);
        testObject.address = {postCode:1234};
        assert.equal(propertyName, "address.postCode");
        assert.equal(changedData, testObject);
        assert.equal(oldData, null);
        assert.equal(newData, 1234);
    });
})();