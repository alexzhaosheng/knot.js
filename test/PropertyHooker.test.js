(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.PropertyHooker", function( assert ) {
        var testObject= {name:"Satoshi"};


        scope.PropertyHooker.hookProperty(testObject, "name");

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


        scope.PropertyHooker.unhookObject(testObject);
        propertyName = changedData = null;

        testObject.name = "Tom";

        assert.equal(propertyName, null);
        assert.equal(changedData, null);
        assert.equal(testObject.name, "Tom");
        assert.equal(JSON.stringify(testObject), JSON.stringify( {name:"Tom"}));

    });
})();