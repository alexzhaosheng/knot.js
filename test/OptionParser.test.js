(function (window){
    var scope = window.Knot.getPrivateScope();


    QUnit.test( "private.OptionParser", function ( assert ) {
        var knots = scope.OptionParser.parse("text:name;"+"isEnabled:nameInputRequired;");

        assert.equal(knots.length, 2, "parse works with simple option string");
        assert.equal(knots[0].leftAP.description, "text", "parse works with simple option string");
        assert.equal(knots[0].leftAP.pipes.length, 0, "parse works with simple option string");
        assert.equal(knots[0].rightAP.description, "name", "parse works with simple option string");
        assert.equal(knots[0].rightAP.pipes.length, 0, "parse works with simple option string");

        knots = scope.OptionParser.parse("text>validateName:name;"+"isEnabled:name>nullToBool", "parse works with option string with pipes");
        assert.equal(knots.length, 2, "parse works with option string with pipes");
        assert.equal(knots[0].leftAP.description, "text", "parse works with option string with pipes");
        assert.equal(knots[0].leftAP.pipes.length, 1, "parse works with option string with pipes");
        assert.equal(knots[0].leftAP.pipes[0], "validateName", "parse works with option string with pipes");
        assert.equal(knots[0].rightAP.description, "name", "parse works with option string with pipes");
        assert.equal(knots[0].rightAP.pipes.length, 0, "parse works with option string with pipes")

        assert.equal(knots[1].leftAP.description, "isEnabled", "parse works with option string with pipes");
        assert.equal(knots[1].leftAP.pipes.length, 0, "parse works with option string with pipes");
        assert.equal(knots[1].rightAP.description, "name", "parse works with option string with pipes");
        assert.equal(knots[1].rightAP.pipes.length, 1, "parse works with option string with pipes")
        assert.equal(knots[1].rightAP.pipes[0], "nullToBool", "parse works with option string with pipes");

        knots = scope.OptionParser.parse("text>trim>validateLength>validateName:name;");
        assert.equal(knots.length, 1, "parse works with option string with multiple pipes");
        assert.equal(knots[0].leftAP.description, "text", "parse works with option string with multiple pipes");
        assert.equal(knots[0].leftAP.pipes.length, 3, "parse works with option string with multiple pipes");
        assert.equal(knots[0].leftAP.pipes[2], "validateName", "parse works with option string with multiple pipes");
        assert.equal(knots[0].leftAP.pipes[1], "validateLength", "parse works with option string with multiple pipes");
        assert.equal(knots[0].leftAP.pipes[0], "trim", "parse works with option string with multiple pipes");


        knots = scope.OptionParser.parse("isEnabled : (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue");
        assert.equal(knots.length, 1, "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].leftAP.description, "isEnabled", "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.isComposite, true, "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.nToOnePipe, "trueWhenAllTrue", "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs.length, 2, "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs[0].description, "isLogged", "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs[0].pipes.length, 0, "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs[1].description, "userId", "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs[1].pipes.length, 1, "parse works with option string with n to 1 pipe");
        assert.equal(knots[0].rightAP.childrenAPs[1].pipes[0], "trueWhenNot0", "parse works with option string with n to 1 pipe");


        knots = scope.OptionParser.parse("isEnabled>{return value?10:1;}:#regOption.selectedIndex>{return value>2?true:false;}>{return value}");
        assert.equal(knots.length, 1, "parse works with option string with embedded functions");
        assert.equal(knots[0].leftAP.description, "isEnabled", "parse works with option string with embedded functions");
        assert.equal(knots[0].leftAP.pipes.length, 1, "parse works with option string with embedded functions");
        assert.equal(knots[0].leftAP.pipes[0].substr(0, "__knot_global.".length), "__knot_global.", "parse works with option string with embedded functions");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].leftAP.pipes[0])(true), 10, "parse works with option string with embedded functions");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].leftAP.pipes[0])(false), 1, "parse works with option string with embedded functions");
        assert.equal(knots[0].rightAP.description, "#regOption.selectedIndex", "parse works with option string with embedded functions");
        assert.equal(knots[0].rightAP.pipes.length, 2, "parse works with option string with embedded functions");
        assert.equal(knots[0].rightAP.pipes[0].substr(0, "__knot_global.".length), "__knot_global.", "parse works with option string with embedded functions");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].rightAP.pipes[0])(1), false, "parse works with option string with embedded functions");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(knots[0].rightAP.pipes[0])(3), true, "parse works with option string with embedded functions");


        //can't both be composite AP
        knots = scope.OptionParser.parse(" (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue : (isLogged & userId>trueWhenNot0 ) > trueWhenAllTrue");
        assert.equal(knots.length,0, "invalid option string get empty result");


        var knot = scope.OptionParser.parse('@click:@{alert("clicked");}')[0];
        assert.equal(knot.rightAP.description[0], "@", "Use a single function as access point");
        assert.equal(scope.GlobalSymbolHelper.isGlobalSymbol(knot.rightAP.description.substr(1)), true, "Use a single function as access point");

        var knot = scope.OptionParser.parse('display:{return this.isVisible?"block":"none";}')[0];
        assert.equal(knot.rightAP.description, "*", "Use a single function as access point");
        assert.equal(knot.rightAP.pipes.length, 1, "Use a single function as access point");
        assert.equal(scope.GlobalSymbolHelper.isGlobalSymbol(knot.rightAP.pipes[0]), true, "Use a single function as access point");


        //knot event
        knot = scope.OptionParser.parse("text:name | @change: @nameChanged, @error: @nameError")[0];
        assert.equal(knot.rightAP.description, "name", "parse options with event");
        assert.equal(knot.knotEvent != null, true, "parse options with event");
        assert.equal(knot.knotEvent["@change"][0], "@nameChanged", "parse options with event");
        assert.equal(knot.knotEvent["@error"][0], "@nameError", "parse options with event");

        knot = scope.OptionParser.parse('@click:@{alert("clicked");} | @change: @nameChanged, @error: @nameError')[0];
        assert.equal(knot.knotEvent["@change"][0], "@nameChanged", "parse options with event");
        assert.equal(knot.knotEvent["@error"][0], "@nameError", "parse options with event");

        knot = scope.OptionParser.parse("text:name | @change: @nameChanged & @valueChanged")[0];
        assert.equal(knot.rightAP.description, "name", "parse options with event");
        assert.equal(knot.knotEvent != null, true, "parse options with event");
        assert.equal(knot.knotEvent["@change"][0], "@nameChanged", "parse options with event");
        assert.equal(knot.knotEvent["@change"][1], "@valueChanged", "parse options with event");

        //parse ap with options
        knot = scope.OptionParser.parse('value[@set:@global.onSet; @change: @global.onChange]:name')[0];
        assert.equal(knot.leftAP.description, "value", "parse ap with options");
        assert.equal(knot.leftAP.options != null, true, "parse ap with options");
        assert.equal(knot.leftAP.options["@set"], "@global.onSet", "parse ap with options");
        assert.equal(knot.leftAP.options["@change"], "@global.onChange", "parse ap with options");


        //parse ap with complex css selector
        knot = scope.OptionParser.parse('value:#(.nameInputSection> input).value')[0];
        assert.equal(knot.leftAP.description, "value", "parse ap with css selector");
        assert.equal(knot.rightAP.description, "#(.nameInputSection> input).value", "parse ap with css selector");
    });
})((function () {
        return this;
    })());