(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();
//    global.QUnit.test( "private.window hash status test", function ( assert ) {
//        window.location.hash = "#test";
//        KnotTestUtility.raiseDOMEvent(window, "hashchange");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "test", "test hash is correctly set");
//
//        scope.WindowHashStatus.setHashFormat(["cate", "type", "id"], "/");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.cate"), "test", "hash fields is correctly set");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.type"), null, "hash fields is correctly set");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.id"), null, "hash fields is correctly set");
//
//        window.location.hash = "#c1/t1/123";
//        KnotTestUtility.raiseDOMEvent(window, "hashchange");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.cate"), "c1", "hash fields is correctly set");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.type"), "t1", "hash fields is correctly set");
//        assert.equal(scope.Utility.getValueOnPath(null, "$hash.id"), "123", "hash fields is correctly set");
//
//        window.location.hash = "";
//    });


    global.QUnit.asyncTest("private.WindowHashStatus.test hash", function (assert) {
        expect(1);
        window.location.hash = "";
        var testFunc = function(){
            assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "test", "test hash is correctly set");
            scope.DataObserver.stopMonitoring(scope.Utility.getValueOnPath(null, "$hash"), "hash", testFunc);
            window.location.hash = "";
            global.QUnit.start();
        };
        scope.DataObserver.monitor(scope.Utility.getValueOnPath(null, "$hash"), "hash", testFunc);
        window.location.hash = "#test";
    });

    global.QUnit.asyncTest("private.WindowHashStatus.test fields", function (assert) {
        expect(6);
        window.location.hash = "abc";
        scope.WindowHashStatus.setHashFormat(["cate", "type", "id"], "/");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.cate"), "abc", "hash fields is correctly set");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.type"), null, "hash fields is correctly set");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.id"), null, "hash fields is correctly set");
        var testFunc = function(){
            window.location.hash = "";
            assert.equal(scope.Utility.getValueOnPath(null, "$hash.cate"), "c1", "hash fields is correctly set");
            assert.equal(scope.Utility.getValueOnPath(null, "$hash.type"), "t1", "hash fields is correctly set");
            assert.equal(scope.Utility.getValueOnPath(null, "$hash.id"), "123", "hash fields is correctly set");
            scope.DataObserver.stopMonitoring(scope.Utility.getValueOnPath(null, "$hash"), "hash", testFunc);
            global.QUnit.start();
        };
        scope.DataObserver.monitor(scope.Utility.getValueOnPath(null, "$hash"), "hash", testFunc);
        window.location.hash = "#c1/t1/123";
    });

    global.QUnit.test("private.WindowHashStatus.test set fields", function (assert) {
        window.location.hash = "#c1/t1/123";
        scope.WindowHashStatus.setHashFormat(["cate", "type", "id"], "/");
        scope.Utility.setValueOnPath(null, "$hash.cate", "c2");
        assert.equal(window.location.hash, "#c2/t1/123", "hash is changed");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "c2/t1/123",  "hash is changed");
        scope.Utility.setValueOnPath(null, "$hash.type", "t2");
        scope.Utility.setValueOnPath(null, "$hash.id", "678");
        assert.equal(window.location.hash, "#c2/t2/678", "hash is changed");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "c2/t2/678",  "hash is changed");
        scope.Utility.setValueOnPath(null, "$hash.type", null);
        scope.Utility.setValueOnPath(null, "$hash.id", null);
        assert.equal(window.location.hash, "#c2", "hash is changed");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "c2",  "hash is changed");

        scope.Utility.setValueOnPath(null, "$hash.type", null);
        scope.Utility.setValueOnPath(null, "$hash.id", 123);
        assert.equal(window.location.hash, "#c2//123", "hash is changed");
        assert.equal(scope.Utility.getValueOnPath(null, "$hash.hash"), "c2//123",  "hash is changed");
        window.location.hash = "";
    });
})(window);