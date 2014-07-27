(function(){
    var scope = Knot.getPrivateScope();


    QUnit.test( "private.OptionParser", function( assert ) {
        var node = KnotTestUtility.parseHTML('<input binding="'+
            'style:{left:*left=>cvt.toLeftNumber; top:top; border-color:!value=>cvt.toBorderColor};'+
            'value:*title=>cvt.trimString&cvt.urlEncoding =!validator.notNull & validator.titleLengthCheck;' +
            '@click:onTitleClicked"></input>');
        var options = scope.OptionParser.parse(node);
        assert.equal(options.binding["style-left"], "left");
        assert.equal(options.twoWayBinding["style-left"], true);
        assert.equal(options.valueConverters["style-left"], "cvt.toLeftNumber");

        assert.equal(options.binding["style-top"], "top");
        assert.equal(options.twoWayBinding["style-top"], undefined);
        assert.equal(options.valueConverters["style-top"], undefined);

        assert.equal(options.binding["style-border-color"], "value");
        assert.equal(options.twoWayBinding["style-border-color"], true);
        assert.equal(options.bindingToError["style-border-color"], true);
        assert.equal(options.valueConverters["style-border-color"], "cvt.toBorderColor");

        assert.equal(options.binding["value"], "title");
        assert.equal(options.twoWayBinding["value"], true);
        assert.equal(options.bindingToError["value"], undefined);
        assert.equal(options.valueConverters["value"], "cvt.trimString&cvt.urlEncoding");
        assert.equal(options.validators["value"].length, 2);
        assert.equal(options.validators["value"][0], "validator.notNull");
        assert.equal(options.validators["value"][1], "validator.titleLengthCheck");

        assert.equal(options.actions["click"], "onTitleClicked");
    });
})();