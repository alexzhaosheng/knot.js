(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.DataMonitor: Event Manager", function( assert ) {
        var listener = {}, listener2 = {};
        var data1 = {}, data2 = {};

        var propertyName = null;
        var changedData = null;
        scope.DataMonitor.register(data1, listener, function(n){
            propertyName = n;
            changedData = this;
        });
        scope.DataMonitor.notifyDataChanged(data1, "sex");
        scope.DataMonitor.notifyDataChanged(data1, "name");
        scope.DataMonitor.notifyDataChanged(data2, "sex");

        assert.equal("name", propertyName);
        assert.equal(data1, changedData);
        assert.equal(true, scope.DataMonitor.hasRegistered(data1, listener));
        assert.equal(false, scope.DataMonitor.hasRegistered(data2, listener));
        assert.equal(false, scope.DataMonitor.hasRegistered(data1, listener2));

        assert.equal(true, scope.DataMonitor.getPropertyChangeRecord(data1).indexOf("sex")>=0);
        assert.equal(true, scope.DataMonitor.getPropertyChangeRecord(data1).indexOf("name")>=0);
        assert.equal(2, scope.DataMonitor.getPropertyChangeRecord(data1).length);

        scope.DataMonitor.resetPropertyChangeRecord(data1);
        assert.equal(0, scope.DataMonitor.getPropertyChangeRecord(data1).length);

        scope.DataMonitor.unregister(data1, listener);

        propertyName = null;
        changedData = null;
        scope.DataMonitor.notifyDataChanged(data1, "name");
        assert.equal(null, propertyName);
        assert.equal(null, changedData);

        assert.equal(false, scope.DataMonitor.hasRegistered(data1, listener));
    });

    QUnit.test( "private.DataMonitor: Property Hook", function( assert ) {
        var testObject= {name:"Satoshi"};


        scope.DataMonitor.hookProperty(testObject, "name");

        var propertyName, changedData;
        scope.DataMonitor.register(testObject, {}, function(n){
            propertyName = n;
            changedData = this;
        });

        testObject.name = "Alex";

        assert.equal(propertyName, "name");
        assert.equal(changedData, testObject);
        assert.equal(testObject.name, "Alex");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Alex"}));


        scope.DataMonitor.unhookProperties(testObject);
        propertyName = changedData = null;

        testObject.name = "Tom";

        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(testObject.name, "Tom");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Tom"}));
    });


})();