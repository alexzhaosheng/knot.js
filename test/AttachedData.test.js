(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.AttachedData", function( assert ) {
        var testData = {};
        scope.AttachedData.getAttachedInfo(testData).test = "test"
        assert.equal("test", scope.AttachedData.getAttachedInfo(testData).test);
        scope.AttachedData.releaseAttachedInfo(testData);
        assert.equal(undefined, scope.AttachedData.getAttachedInfo(testData).test);
    });
})();