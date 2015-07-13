(function (global) {
    "use strict";
    var scope = global.Knot.getPrivateScope();
    global.QUnit.test( "private.ArrayMonitor", function ( assert ) {
        var testArray = [];
        var changed = false;
        scope.DataObserver.monitor(testArray, null, function () {
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
        testArray.unshift("test");
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

    global.QUnit.test( "private.ArrayMonitor array changed information", function ( assert ) {
        var testArray = [], copiedArray= [];
        var changed = false;
        var arrayChangedInfo;
        scope.DataObserver.monitor(testArray, null, function (path, o, n, changedInfo) {
            changed = true;
            if(path !== "*")
                return;
            arrayChangedInfo = changedInfo;
            if(arrayChangedInfo){
                for(var i=arrayChangedInfo.removed.length -1; i>=0; i--){
                    copiedArray.splice(arrayChangedInfo.removed[i], 1);
                }
                for(i=0; i< arrayChangedInfo.added.length; i++){
                    copiedArray.splice(arrayChangedInfo.added[i], 0, testArray[arrayChangedInfo.added[i]]);
                }
            }
        });
        function areArraysTheSame(){
            if(testArray.length !== copiedArray.length) {
                return false;
            }
            for(var i=0; i<testArray.length; i++){
                if(testArray[i] !== copiedArray[i]){
                    return false;
                }
            }
            return true;
        }

        testArray.push("0");
        assert.notEqual(typeof(arrayChangedInfo), "undefined", "Array changed info is passed.");
        assert.equal(arrayChangedInfo.added.length, 1, "added is properly set");
        assert.equal(areArraysTheSame(), true, "added is properly set");

        testArray.push("1", "2", "3");
        assert.equal(areArraysTheSame(), true, "added is properly set");

        testArray.unshift("a", "b", "c");
        assert.equal(areArraysTheSame(), true, "added is properly set");

        testArray.pop();
        assert.equal(areArraysTheSame(), true, "removed is properly set");
        testArray.shift();
        assert.equal(areArraysTheSame(), true, "removed is properly set");


        testArray.splice(2, 2, "x", "y", "z");
        assert.equal(areArraysTheSame(), true, "removed and added is properly set");

        testArray.splice(1, 0, "xx", "yy", "zz");
        assert.equal(areArraysTheSame(), true, "removed and added is properly set");

        testArray.splice(1, 1);
        assert.equal(areArraysTheSame(), true, "removed and added is properly set");

        testArray.setValueAt(2, "abc");
        assert.equal(areArraysTheSame(), true, "setValueAt works");
        assert.equal(testArray[2], "abc", "setValueAt works");

        testArray.clear();
        assert.equal(areArraysTheSame(), true, "clear works");
        assert.equal(testArray.length, 0, "clear works");
    });
})(window);