(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test("private.Utility", function( assert ) {
        assert.equal(true, scope.Utility.isEmptyObj({}));
        assert.equal(false,scope.Utility.isEmptyObj({name:"alex"}));

        window.globalObject = {name:"global"};

        var o = {name:"alex", assert:{money:100}};

        assert.equal("alex", scope.Utility.getValueOnPath(o, "name"));
        assert.equal(o, scope.Utility.getValueOnPath(o, ""));
        assert.equal(100, scope.Utility.getValueOnPath(o, "assert.money"));
        assert.equal(true, typeof(scope.Utility.getValueOnPath(o, "assert.nothing"))=="undefined");

        assert.equal(globalObject.name, scope.Utility.getValueOnPath(o, "/globalObject.name"));

        assert.equal(true, typeof(scope.Utility.getValueOnPath(null, "nothing"))=="undefined");

        delete window.globalObject;

        window.globalObject = {name:"global"};

        o = {name:"alex", assert:{money:100}};

        scope.Utility.setValueOnPath(o, "name", "jack");
        assert.equal(scope.Utility.getValueOnPath(o, "name"), "jack");

        scope.Utility.setValueOnPath(o, "assert.money", 101);
        assert.equal( scope.Utility.getValueOnPath(o, "assert.money"), 101);

        scope.Utility.setValueOnPath(null, "/globalObject.name", "new name");
        assert.equal(scope.Utility.getValueOnPath(o, "/globalObject.name"), "new name");

        //should not throw exception
        scope.Utility.setValueOnPath(o, "nothing.nothing", "nothing");

        delete window.globalObject;

        var info = scope.Utility.getBlockInfo("xx{abc}xx", 0, "{", "}");
        assert.equal(info!=null, true);
        assert.equal(info.start, 2);
        assert.equal(info.end, 6);
    });

})();

