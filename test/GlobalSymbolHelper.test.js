(function (window){
    var scope = window.Knot.getPrivateScope();

    QUnit.test( "private.GlobalSymbolHelper", function ( assert ) {
        var n = scope.GlobalSymbolHelper.registerSymbol({p1:1, p2:2});
        assert.equal(scope.GlobalSymbolHelper.getSymbol(n+".p1"), 1, "getSymbol works");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(n+".p2"), 2, "getSymbol works");

        window.knotTest = {p1:"property1", p2:2, p4:null};
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p1"), "property1", "getSymbol works with object in global scope");
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p2"), 2, "getSymbol works with object in global scope");
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p3"), undefined, "getSymbol works with object in global scope");
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p4"), null, "getSymbol works with object in global scope");

        assert.equal(scope.GlobalSymbolHelper.getSymbol("nothing"), undefined, "getSymbol works with no-existed object");
        assert.equal(scope.GlobalSymbolHelper.getSymbol("nothing.p4"), undefined, "getSymbol works with no-existed object");
    });
})((function () {
        return this;
    })());