(function (global) {
    "use strict";
    var scope = global.Knot.getPrivateScope();

    global.QUnit.test( "private.Deferred", function ( assert ) {
        var result = null;
        var error = null;

        var d = new scope.Deferred();
        d.done(function (res) {
                result = res;
            },
            function (err) {

            });

        assert.equal(result, null, "make sure 'done' is not executed");
        assert.equal(error, null, "make sure 'done' is not executed");

        d.resolve("test res");
        assert.equal(result, "test res", '"done" is executed by calling success callback');
        assert.equal(error, null, '"done" is executed by calling success callback');

        result = null;
        error = null;

        d = new scope.Deferred();
        d.done(function (res) {
            },
            function (err) {
                error = err;
            });

        assert.equal(result, null, "make sure 'done' is not executed");
        assert.equal(error, null, "make sure 'done' is not executed");

        d.reject("test res");
        assert.equal(error, "test res", '"done" is executed by calling fail callback');
        assert.equal(result, null, '"done" is executed by calling fail callback');


        result = null;
        error = null;

        d = new scope.Deferred();
        d.resolve("test result");
        d.done(function (res) {
                result = res;
            },
            function (err) {
                error = err;
            });

        assert.equal(result, "test result", '"done" is executed immediately by calling success callback');
        assert.equal(error, null, '"done" is executed immediately by calling success callback');


        result = null;
        error = null;
        d = new scope.Deferred();
        d.reject("test result");
        d.done(function (res) {
                result = res;
            },
            function (err) {
                error = err;
            });

        assert.equal(error, "test result", '"done" is executed immediately by calling fail callback');
        assert.equal(result, null, '"done" is executed immediately by calling fail callback');
    });

})(window);
