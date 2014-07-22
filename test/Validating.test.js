(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.Validating", function( assert ) {
        var listener = {}, listener2 = {};
        var data1 = {}, data2 = {};

        var propertyName = null;
        var changedData = null;
        scope.Validating.registerOnError(data1, listener, function(n){
            propertyName = n;
            changedData = this;
        });
        scope.Validating.setError(data1, "name", "can't be null!");
        assert.equal(scope.Validating.getError(data1,"name"), "can't be null!");
        assert.equal(scope.Validating.getError(data2,"name"), null);
        assert.equal(propertyName, "name");
        assert.equal(changedData, data1);

        assert.equal(scope.Validating.hasRegisteredOnError(data1, listener), true);
        assert.equal(scope.Validating.hasRegisteredOnError(data2, listener), false);
        assert.equal(scope.Validating.hasRegisteredOnError(data1, listener2), false);

        scope.Validating.unregisterOnError(data1, listener);
        assert.equal(scope.Validating.hasRegisteredOnError(data1, listener), false);
    });
})();