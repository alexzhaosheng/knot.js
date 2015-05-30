(function(){
    var scope = Knot.getPrivateScope();


    QUnit.test( "private.OptionParser", function( assert ) {
        var knots = scope.OptionParser.parse("text:name;"+"isEnabled:nameInputRequired;");

        assert.equal(knots.length, 2);
        assert.equal(knots[0].leftAP.name, "text");
        assert.equal(knots[0].leftAP.pipes.length, 0);
        assert.equal(knots[0].rightAP.name, "name");
        assert.equal(knots[0].rightAP.pipes.length, 0);

        knots = scope.OptionParser.parse("text>validateName:name;"+"isEnabled:name>nullToBool");
        assert.equal(knots.length, 2);
        assert.equal(knots[0].leftAP.name, "text");
        assert.equal(knots[0].leftAP.pipes.length, 1);
        assert.equal(knots[0].leftAP.pipes[0], "validateName");
        assert.equal(knots[0].rightAP.name, "name");
        assert.equal(knots[0].rightAP.pipes.length, 0)

        assert.equal(knots[1].leftAP.name, "isEnabled");
        assert.equal(knots[1].leftAP.pipes.length, 0);
        assert.equal(knots[1].rightAP.name, "name");
        assert.equal(knots[1].rightAP.pipes.length, 1)
        assert.equal(knots[1].rightAP.pipes[0], "nullToBool");

        knots = scope.OptionParser.parse("text>trim>validateLength>validateName:name;");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].leftAP.name, "text");
        assert.equal(knots[0].leftAP.pipes.length, 3);
        assert.equal(knots[0].leftAP.pipes[2], "validateName");
        assert.equal(knots[0].leftAP.pipes[1], "validateLength");
        assert.equal(knots[0].leftAP.pipes[0], "trim");


        knots = scope.OptionParser.parse("isEnabled : (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].leftAP.name, "isEnabled");
        assert.equal(knots[0].rightAP.isComposite, true);
        assert.equal(knots[0].rightAP.nToOnePipe, "trueWhenAllTrue");
        assert.equal(knots[0].rightAP.childrenAPs.length, 2);
        assert.equal(knots[0].rightAP.childrenAPs[0].name, "isLogged");
        assert.equal(knots[0].rightAP.childrenAPs[0].pipes.length, 0);
        assert.equal(knots[0].rightAP.childrenAPs[1].name, "userId");
        assert.equal(knots[0].rightAP.childrenAPs[1].pipes.length, 1);
        assert.equal(knots[0].rightAP.childrenAPs[1].pipes[0], "trueWhenNot0");


        knots = scope.OptionParser.parse("isEnabled>{return value?10:1;}:#regOption.selectedIndex>{return value>2?true:false;}");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].leftAP.name, "isEnabled");
        assert.equal(knots[0].leftAP.pipes.length, 1);
        assert.equal(knots[0].leftAP.pipes[0].substr(0, "__knot_global.".length), "__knot_global.");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].leftAP.pipes[0])(true), 10);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].leftAP.pipes[0])(false), 1);
        assert.equal(knots[0].rightAP.name, "#regOption.selectedIndex");
        assert.equal(knots[0].rightAP.pipes.length, 1);
        assert.equal(knots[0].rightAP.pipes[0].substr(0, "__knot_global.".length), "__knot_global.");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].rightAP.pipes[0])(1), false);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].rightAP.pipes[0])(3), true);


        //can't both be composite AP
        knots = scope.OptionParser.parse(" (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue : (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue");
        assert.equal(knots.length,0);
    });
})();