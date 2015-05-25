(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.Utility.isEmptyObj", function( assert ) {
        assert.equal(true, scope.Utility.isEmptyObj({}));
        assert.equal(false,scope.Utility.isEmptyObj({name:"alex"}));
    });

    QUnit.test( "private.Utility.getValueOnPath", function( assert ) {
        window.globalObject = {name:"global"};

        var o = {name:"alex", assert:{money:100}};

        assert.equal("alex", scope.Utility.getValueOnPath(o, "name"));
        assert.equal(o, scope.Utility.getValueOnPath(o, ""));
        assert.equal(100, scope.Utility.getValueOnPath(o, "assert.money"));
        assert.equal(true, typeof(scope.Utility.getValueOnPath(o, "assert.nothing"))=="undefined");

        assert.equal(globalObject.name, scope.Utility.getValueOnPath(o, "/globalObject.name"));

        assert.equal(true, typeof(scope.Utility.getValueOnPath(null, "nothing"))=="undefined");

        delete window.globalObject;
    });

    QUnit.test( "private.Utility.getBlockInfo", function( assert ) {
        var info = scope.Utility.getBlockInfo("xx{abc}xx", 0, "{", "}");
        assert.equal(info!=null, true);
        assert.equal(info.start, 2);
        assert.equal(info.end, 6);
    });

})();

