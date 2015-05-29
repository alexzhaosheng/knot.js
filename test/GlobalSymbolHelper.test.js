(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.GlobalSymbolHelper", function( assert ) {
        var n = scope.GlobalSymbolHelper.registerSymbol({p1:1, p2:2});
        assert.equal(scope.GlobalSymbolHelper.getSymbol(n+".p1"), 1);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(n+".p2"), 2);

        window.knotTest = {p1:"property1", p2:2, p4:null};
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p1"), "property1");
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p2"), 2);
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p3"), undefined);
        assert.equal(scope.GlobalSymbolHelper.getSymbol("knotTest.p4"), null);

        assert.equal(scope.GlobalSymbolHelper.getSymbol("nothing"), undefined);
        assert.equal(scope.GlobalSymbolHelper.getSymbol("nothing.p4"), undefined);
    });
})();