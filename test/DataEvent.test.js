(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.DataEventMgr", function( assert ) {
        var listener = {}, listener2 = {};
        var data1 = {}, data2 = {};

        var propertyName = null;
        var changedData = null;
        scope.DataEventMgr.register(data1, listener, function(n){
            propertyName = n;
            changedData = this;
        });
        scope.DataEventMgr.notifyDataChanged(data1, "sex");
        scope.DataEventMgr.notifyDataChanged(data1, "name");
        scope.DataEventMgr.notifyDataChanged(data2, "sex");

        assert.equal("name", propertyName);
        assert.equal(data1, changedData);
        assert.equal(true, scope.DataEventMgr.hasRegistered(data1, listener));
        assert.equal(false, scope.DataEventMgr.hasRegistered(data2, listener));
        assert.equal(false, scope.DataEventMgr.hasRegistered(data1, listener2));

        assert.equal(true, scope.DataEventMgr.getPropertyChangeRecord(data1).indexOf("sex")>=0);
        assert.equal(true, scope.DataEventMgr.getPropertyChangeRecord(data1).indexOf("name")>=0);
        assert.equal(2, scope.DataEventMgr.getPropertyChangeRecord(data1).length);

        scope.DataEventMgr.resetPropertyChangeRecord(data1);
        assert.equal(0, scope.DataEventMgr.getPropertyChangeRecord(data1).length);

        scope.DataEventMgr.unregister(data1, listener);

        propertyName = null;
        changedData = null;
        scope.DataEventMgr.notifyDataChanged(data1, "name");
        assert.equal(null, propertyName);
        assert.equal(null, changedData);

        assert.equal(false, scope.DataEventMgr.hasRegistered(data1, listener));

    });
})();