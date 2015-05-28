(function(){
    var scope = Knot.getPrivateScope();


    QUnit.test( "private.OptionParser", function( assert ) {
        var knots = scope.OptionParser.parse("text:name;"+"isEnabled:nameInputRequired;");

        assert.equal(knots.length, 2);
        assert.equal(knots[0].elementAccessPoint.accessPoint, "text");
        assert.equal(knots[0].elementAccessPoint.pipes.length, 0);
        assert.equal(knots[0].tiedUpAccessPoint.accessPoint, "name");
        assert.equal(knots[0].tiedUpAccessPoint.pipes.length, 0);

        knots = scope.OptionParser.parse("text>validateName:name;"+"isEnabled:name>nullToBool");
        assert.equal(knots.length, 2);
        assert.equal(knots[0].elementAccessPoint.accessPoint, "text");
        assert.equal(knots[0].elementAccessPoint.pipes.length, 1);
        assert.equal(knots[0].elementAccessPoint.pipes[0], "validateName");
        assert.equal(knots[0].tiedUpAccessPoint.accessPoint, "name");
        assert.equal(knots[0].tiedUpAccessPoint.pipes.length, 0)

        assert.equal(knots[1].elementAccessPoint.accessPoint, "isEnabled");
        assert.equal(knots[1].elementAccessPoint.pipes.length, 0);
        assert.equal(knots[1].tiedUpAccessPoint.accessPoint, "name");
        assert.equal(knots[1].tiedUpAccessPoint.pipes.length, 1)
        assert.equal(knots[1].tiedUpAccessPoint.pipes[0], "nullToBool");

        knots = scope.OptionParser.parse("text>trim>validateLength>validateName:name;");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAccessPoint.accessPoint, "text");
        assert.equal(knots[0].elementAccessPoint.pipes.length, 3);
        assert.equal(knots[0].elementAccessPoint.pipes[2], "validateName");
        assert.equal(knots[0].elementAccessPoint.pipes[1], "validateLength");
        assert.equal(knots[0].elementAccessPoint.pipes[0], "trim");


        knots = scope.OptionParser.parse("isEnabled : (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAccessPoint.accessPoint, "isEnabled");
        assert.equal(knots[0].tiedUpAccessPoint.isCompositeAccessPoint, true);
        assert.equal(knots[0].tiedUpAccessPoint.nToOnePipe, "trueWhenAllTrue");
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints.length, 2);
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints[0].accessPoint, "isLogged");
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints[0].pipes.length, 0);
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints[1].accessPoint, "userId");
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints[1].pipes.length, 1);
        assert.equal(knots[0].tiedUpAccessPoint.accessPoints[1].pipes[0], "trueWhenNot0");


        knots = scope.OptionParser.parse("isEnabled>{return value?10:1;}:#regOption.selectedIndex>{return value>2?true:false;}");
        assert.equal(knots.length, 1);
        assert.equal(knots[0].elementAccessPoint.accessPoint, "isEnabled");
        assert.equal(knots[0].elementAccessPoint.pipes.length, 1);
        assert.equal(knots[0].elementAccessPoint.pipes[0], "__knotEmbedded.f_0");
        assert.equal(scope.EmbeddedFunctions["f_0"](true), 10);
        assert.equal(scope.EmbeddedFunctions["f_0"](false), 1);
        assert.equal(knots[0].tiedUpAccessPoint.accessPoint, "#regOption.selectedIndex");
        assert.equal(knots[0].tiedUpAccessPoint.pipes.length, 1);
        assert.equal(knots[0].tiedUpAccessPoint.pipes[0], "__knotEmbedded.f_1");
        assert.equal(scope.EmbeddedFunctions["f_1"](1), false);
        assert.equal(scope.EmbeddedFunctions["f_1"](3), true);
    });
})();