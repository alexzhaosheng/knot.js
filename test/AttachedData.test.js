(function (window){
    var scope = window.Knot.getPrivateScope();

    QUnit.test( "private.AttachedData", function ( assert ) {
        var testData = {};
        scope.AttachedData.getAttachedInfo(testData).test = "test"
        assert.equal(scope.AttachedData.getAttachedInfo(testData).test, "test", "getAttachedInfo get correct result");
        scope.AttachedData.releaseAttachedInfo(testData);
        assert.equal(undefined, scope.AttachedData.getAttachedInfo(testData).test, "releaseAttachedInfo release the attached data");
    });
})((function () {
        return this;
    })());