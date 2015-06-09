(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.Deferred.resolve", function( assert ) {
        var result = null;
        var error = null;

        var d = new scope.Deferred();
        d.done(function(res){
                result = res;
            },
            function(err){

            });

        assert.equal(true, result === null);
        assert.equal(true, error === null);

        d.resolve("test res");
        assert.equal(true, result === "test res");
        assert.equal(true, error === null);

        result = null;
        error = null;

        d = new scope.Deferred();
        d.done(function(res){
            },
            function(err){
                error = err;
            });

        assert.equal(true, result === null);
        assert.equal(true, error === null);

        d.reject("test res");
        assert.equal(true, result === null);
        assert.equal(true, error === "test res");


        result = null;
        error = null;

        d = new scope.Deferred();
        d.resolve("test result");
        d.done(function(res){
                result = res;
            },
            function(err){
                error = err;
            });

        assert.equal(result, "test result");
        assert.equal(error, null);


        result = null;
        error = null;
        d = new scope.Deferred();
        d.reject("test result");
        d.done(function(res){
                result = res;
            },
            function(err){
                error = err;
            });

        assert.equal(error, "test result");
        assert.equal(result, null);
    });

})();
