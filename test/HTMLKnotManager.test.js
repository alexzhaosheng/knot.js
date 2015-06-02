(function(){
    var scope = Knot.getPrivateScope();

    var findCBS = function(selector){
        return scope.HTMLKnotManager.normalizedCBS[selector];
    }

    QUnit.test( "private.HTMLKnotManager.CBS", function( assert ) {
        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);


        var resetTest = function(){
            document.getElementsByTagName("head")[0].removeChild(scriptBlock);
            scope.HTMLKnotManager.normalizedCBS = [];
        };


        scope.HTMLKnotManager.parseCBS();

        assert.equal(findCBS("#cbsTest") != null, true);
        assert.equal(findCBS("#cbsTest").length, 1);
        assert.equal(findCBS(".cbsTestClass span").length, 3);
        assert.equal(findCBS(".cbsTestClass span")[0], "text:title");
        assert.equal(findCBS(".cbsTestClass span")[1], "text:description");
        assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid");


        resetTest();

        scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test>{return value*10;}} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();

        assert.equal(findCBS("#cbsTest") != null, true);
        assert.equal(findCBS("#cbsTest").length, 1);
        assert.equal(findCBS("#cbsTest")[0].substr(0, "value:test>".length), "value:test>");
        var func = findCBS("#cbsTest")[0].substr("value:test>".length);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(func)(3) , 30);
        assert.equal(findCBS(".cbsTestClass span").length, 3);
        assert.equal(findCBS(".cbsTestClass span")[0], "text:title");
        assert.equal(findCBS(".cbsTestClass span")[1], "text:description");
        assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid");

        resetTest();
    });


    QUnit.asyncTest("private.HTMLKnotManager.Loading From File", function(assert){
        expect(9);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs" src="HTMLKnotManager.test.cbs">');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);
        scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS().done(function(){
            try{
                assert.equal(findCBS("#cbsTest") != null, true);
                assert.equal(findCBS("#cbsTest").length, 3);
                assert.equal(findCBS("#cbsTest")[1].substr(0, "checked:gender>".length), "checked:gender>");
                var func = findCBS("#cbsTest")[1].substr("checked:gender>".length);
                assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("m") , true);
                assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("f") , false);
                assert.equal(findCBS(".cbsTestClass span").length, 3);
                assert.equal(findCBS(".cbsTestClass span")[0], "text:title");
                assert.equal(findCBS(".cbsTestClass span")[1], "text:description");
                assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid");
            }
            catch (err){

            }
            QUnit.start();
        },
        function(err){
            Console.writeln(err);
            QUnit.start();
        });;
    });

    QUnit.test( "private.HTMLKnotManager.applyCBS", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        document.getElementsByTagName("body")[0].appendChild(testDiv);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#userNameInput{text:name;} \r\n'+
            '</script>');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);

        var input =  KnotTestUtility.parseHTML('<input type="text" id="userNameInput" binding="isEnabled:isActivated;style-background:age>{return value<=18?\'red\':\'green\';}"/>');
        testDiv.appendChild(input);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        assert.equal(input.__knot_options != null, true);
        assert.equal(input.__knot_options["text:name"] != null, true);
        assert.equal(input.__knot_options["text:name"].leftAP.name, "text");
        assert.equal(input.__knot_options["text:name"].rightAP.name, "name");

        assert.equal(input.__knot_options["isEnabled:isActivated"] != null, true);
        assert.equal(input.__knot_options["isEnabled:isActivated"].leftAP.name, "isEnabled");
        assert.equal(input.__knot_options["isEnabled:isActivated"].rightAP.name, "isActivated");

        var lastKnot = null;
        for(var p in input.__knot_options){
            if(p.substr(0, "style-background".length) == "style-background"){
                lastKnot = p;
                break;
            }
        }
        assert.equal(lastKnot != null, true);
        assert.equal(input.__knot_options[lastKnot].leftAP.name, "style-background");
        assert.equal(input.__knot_options[lastKnot].rightAP.name, "age");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot_options[lastKnot].rightAP.pipes[0])(10), "red");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot_options[lastKnot].rightAP.pipes[0])(30), "green");
    });
})();
