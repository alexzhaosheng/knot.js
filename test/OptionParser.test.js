(function(){
    var scope = Knot.getPrivateScope();


    QUnit.test( "private.OptionParser", function( assert ) {
        var knots = scope.OptionParser.parse("text:name;"+"isEnabled:nameInputRequired;");

        assert.equal(knots.length, 2);
        assert.equal(knots[0].elementAP.AP, "text");
        assert.equal(knots[0].elementAP.pipes.length, 0);
        assert.equal(knots[0].attachedAP.AP, "name");
        assert.equal(knots[0].attachedAP.pipes.length, 0);

        knots = scope.OptionParser.parse("text>validateName:name;"+"isEnabled:name>nullToBool");
        assert.equal(knots.length, 2);
        assert.equal(knots[0].elementAP.AP, "text");
        assert.equal(knots[0].elementAP.pipes.length, 1);
        assert.equal(knots[0].elementAP.pipes[0], "validateName");
        assert.equal(knots[0].attachedAP.AP, "name");
        assert.equal(knots[0].attachedAP.pipes.length, 0)

        assert.equal(knots[1].elementAP.AP, "isEnabled");
        assert.equal(knots[1].elementAP.pipes.length, 0);
        assert.equal(knots[1].attachedAP.AP, "name");
        assert.equal(knots[1].attachedAP.pipes.length, 1)
        assert.equal(knots[1].attachedAP.pipes[0], "nullToBool");

        knots = scope.OptionParser.parse("text>trim>validateLength>validateName:name;");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAP.AP, "text");
        assert.equal(knots[0].elementAP.pipes.length, 3);
        assert.equal(knots[0].elementAP.pipes[2], "validateName");
        assert.equal(knots[0].elementAP.pipes[1], "validateLength");
        assert.equal(knots[0].elementAP.pipes[0], "trim");


        knots = scope.OptionParser.parse("isEnabled : (isLogged & userId>trueWhenNot0 )>trueWhenAllTrue");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAP.AP, "isEnabled");
        assert.equal(knots[0].attachedAP.isCompositeAP, true);
        assert.equal(knots[0].attachedAP.nToOnePipe, "trueWhenAllTrue");
        assert.equal(knots[0].attachedAP.APs.length, 2);
        assert.equal(knots[0].attachedAP.APs[0].AP, "isLogged");
        assert.equal(knots[0].attachedAP.APs[0].pipes.length, 0);
        assert.equal(knots[0].attachedAP.APs[1].AP, "userId");
        assert.equal(knots[0].attachedAP.APs[1].pipes.length, 1);
        assert.equal(knots[0].attachedAP.APs[1].pipes[0], "trueWhenNot0");


        knots = scope.OptionParser.parse("isEnabled>{return value?10:1;}:#regOption.selectedIndex>{return value>2?true:false;}");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAP.AP, "isEnabled");
        assert.equal(knots[0].elementAP.pipes.length, 1);
        assert.equal(knots[0].elementAP.pipes[0], "__knot.f_0");
        assert.equal(scope.EmbeddedFunctions["f_0"](true), 10);
        assert.equal(scope.EmbeddedFunctions["f_0"](false), 1);
        assert.equal(knots[0].attachedAP.AP, "#regOption.selectedIndex");
        assert.equal(knots[0].attachedAP.pipes.length, 1);
        assert.equal(knots[0].attachedAP.pipes[0], "__knot.f_1");
        assert.equal(scope.EmbeddedFunctions["f_1"](1), false);
        assert.equal(scope.EmbeddedFunctions["f_1"](3), true);
    });
})();