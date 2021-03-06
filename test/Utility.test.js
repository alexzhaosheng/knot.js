(function (global) {
    "use strict";
    var scope = global.Knot.getPrivateScope();

    global.QUnit.test("private.Utility", function ( assert ) {
        assert.equal(true, scope.Utility.isEmptyObj({}), "isEmptyObj works with the empty objects");
        assert.equal(false,scope.Utility.isEmptyObj({name:"alex"}, "isEmptyObj works with the objects has something"));

        global.globalObject = {name:"global"};

        var o = {name:"alex", assert:{money:100}};

        assert.equal( scope.Utility.getValueOnPath(o, "name"), "alex","getValueOnPath works with simple path");
        assert.equal(scope.Utility.getValueOnPath(o, ""),o,  "getValueOnPath works with empty path (return object it-self)");
        assert.equal(scope.Utility.getValueOnPath(o, "assert.money"),100,  "getValueOnPath works with composite path");
        assert.equal(typeof(scope.Utility.getValueOnPath(o, "assert.nothing")), "undefined","getValueOnPath works with the empty result");

        assert.equal(scope.Utility.getValueOnPath(o, "/globalObject.name"), global.globalObject.name, "getValueOnPath works with the absolute path");

        assert.equal(typeof(scope.Utility.getValueOnPath(null, "nothing")), "undefined", "getValueOnPath works with null object");

        assert.equal(scope.Utility.getValueOnPath(o, "assert.*"), o.assert, "getValueOnPath works with *");

        delete global.globalObject;

        global.globalObject = {name:"global"};

        o = {name:"alex", assert:{money:100}};

        scope.Utility.setValueOnPath(o, "name", "jack");
        assert.equal(scope.Utility.getValueOnPath(o, "name"), "jack","setValueOnPath works with simple path");

        scope.Utility.setValueOnPath(o, "assert.money", 101);
        assert.equal( scope.Utility.getValueOnPath(o, "assert.money"), 101, "setValueOnPath works with composite path");

        scope.Utility.setValueOnPath(null, "/globalObject.name", "new name");
        assert.equal(scope.Utility.getValueOnPath(o, "/globalObject.name"), "new name", "setValueOnPath works with the absolute path");

        //should not throw exception
        scope.Utility.setValueOnPath(o, "nothing.nothing", "nothing");

        delete global.globalObject;

        var info = scope.Utility.getBlockInfo("xx{abc}xx", 0, "{", "}");
        assert.equal(info!==null, true, "getBlockInfo works");
        assert.equal(info.start, 2, "getBlockInfo has correct start");
        assert.equal(info.end, 6, "getBlockInfo has correct end");


        var str = "abc:efg";
        var arr = scope.Utility.splitWithBlockCheck(str, ":");
        assert.equal(arr.length, 2, "split with block check");
        assert.equal(arr[0], "abc", "split with block check");
        assert.equal(arr[1], "efg", "split with block check");

        str = "abc(123:456):efg";
        arr = scope.Utility.splitWithBlockCheck(str, ":");
        assert.equal(arr.length, 2, "split with block check");
        assert.equal(arr[0], "abc(123:456)", "split with block check");
        assert.equal(arr[1], "efg", "split with block check");

        str = "abc[123:456]:e";
        arr = scope.Utility.splitWithBlockCheck(str, ":");
        assert.equal(arr.length, 2, "split with block check");
        assert.equal(arr[0], "abc[123:456]", "split with block check");
        assert.equal(arr[1], "e", "split with block check");

        str = "abc(sdf:[123:456]):e";
        arr = scope.Utility.splitWithBlockCheck(str, ":");
        assert.equal(arr.length, 2, "split with block check");
        assert.equal(arr[0], "abc(sdf:[123:456])", "split with block check");
        assert.equal(arr[1], "e", "split with block check");

        arr = scope.Utility.splitWithBlockCheck("abc(sdf:[123:456])", ":");
        assert.equal(arr.length, 1, "split with block check");
        assert.equal(arr[0], "abc(sdf:[123:456])", "split with block check");

        str = "abc[123:456]=>e";
        arr = scope.Utility.splitWithBlockCheck(str, "=>");
        assert.equal(arr.length, 2, "split with block check");
        assert.equal(arr[0], "abc[123:456]", "split with block check");
        assert.equal(arr[1], "e", "split with block check");

    });

})(window);