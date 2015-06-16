(function(window){
    var scope = window.Knot.getPrivateScope();
    QUnit.test( "private.ArrayMonitor", function( assert ) {
        var testArray = [];
        var changed = false;
        scope.DataObserver.monitor(testArray, null, function(){
            changed = true;
        });
        testArray.push("test");
        assert.equal(changed, true, "array.push works");
        assert.equal(testArray.length, 1, "array.push works");
        assert.equal(testArray[0], "test", "array.push works");

        changed =false;
        assert.equal(testArray.pop(), "test", "array.pop works");
        assert.equal(changed, true, "array.pop works");
        assert.equal(testArray.length, 0, "array.pop works");


        changed =false;
        testArray.unshift("test")
        assert.equal(testArray[0], "test", "array.unshift works");
        assert.equal(changed, true, "array.unshift works");
        assert.equal(testArray.length, 1, "array.unshift works");

        changed =false;
        assert.equal(testArray.shift(), "test", "array.shift works");
        assert.equal(changed, true, "array.shift works");
        assert.equal(testArray.length, 0, "array.shift works");

        testArray.push("test1", "test2", "test3");
        changed =false;
        testArray.splice(1,1);
        assert.equal(changed, true, "array.splice works");
        assert.equal(testArray.length, 2, "array.splice works");
        assert.equal(testArray[0], "test1", "array.splice works");
        assert.equal(testArray[1], "test3", "array.splice works");


        testArray.splice(0, testArray.length, "test2", "test1", "test3");
        changed =false;
        testArray.sort();
        assert.equal(changed, true, "array.sort works");
        assert.equal(testArray[0], "test1", "array.sort works");
        assert.equal(testArray[2], "test3", "array.sort works");

        changed =false;
        testArray.reverse();
        assert.equal(changed, true, "array.reverse works");
        assert.equal(testArray[2], "test1", "array.reverse works");
        assert.equal(testArray[0], "test3", "array.reverse works");
    });
})((function() {
        return this;
    })());