(function(){
    var scope = Knot.getPrivateScope();
    QUnit.test( "private.ArrayMonitor", function( assert ) {
        var testArray = [];
        var changed = false;
        scope.DataMonitor.monitor(testArray, null, function(){
            changed = true;
        });
        testArray.push("test");
        assert.equal(changed, true);
        assert.equal(testArray.length, 1);
        assert.equal(testArray[0], "test");

        changed =false;
        assert.equal(testArray.pop(), "test");
        assert.equal(changed, true);
        assert.equal(testArray.length, 0);


        changed =false;
        testArray.unshift("test")
        assert.equal(testArray[0], "test");
        assert.equal(changed, true);
        assert.equal(testArray.length, 1);

        changed =false;
        assert.equal(testArray.shift(), "test");
        assert.equal(changed, true);
        assert.equal(testArray.length, 0);

        testArray.push("test1", "test2", "test3");
        changed =false;
        testArray.splice(1,1);
        assert.equal(changed, true);
        assert.equal(testArray.length, 2);
        assert.equal(testArray[0], "test1");
        assert.equal(testArray[1], "test3");

    });
})();