(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.Deffered.resolve", function( assert ) {
        var result = null;
        var error = null;

        var d = new scope.Deffered();
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

    });


    QUnit.test( "private.Deffered.reject", function( assert ) {
        var result = null;
        var error = null;

        var d = new scope.Deffered();
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

    });

})();
