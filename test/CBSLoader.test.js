(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();

    var findCBS = function (s, selector) {
        return s.CBS[selector];
    };

    var bodyNode = document.getElementsByTagName("body")[0];
    var headNode = document.getElementsByTagName("head")[0];

    global.QUnit.test( "private.CBSLoader.CBS", function ( assert ) {
        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);


        var resetTest = function () {
            headNode.removeChild(scriptBlock);
        };


        var scopes;
        scope.CBSLoader.test.parseCBSInDocument()
            .done(function(texts){
                scopes = scope.CBSLoader.test.getScopes(texts, false);
            });

        assert.equal(findCBS(scopes[0], "#cbsTest") !== null, true, "parseCBS works");
        assert.equal(findCBS(scopes[0], "#cbsTest").length, 1, "parseCBS works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span").length, 3, "parseCBS works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[0], "text:title", "parseCBS works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[1], "text:description", "parseCBS works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[2], "isEnabled:valid", "parseCBS works");


        resetTest();

        scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test>{return value*10;}} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.CBSLoader.test.parseCBSInDocument()
            .done(function(texts){
                scopes = scope.CBSLoader.test.getScopes(texts, false);
            });

        assert.equal(findCBS(scopes[0], "#cbsTest") != null, true, "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], "#cbsTest").length, 1, "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], "#cbsTest")[0].substr(0, "value:test>".length), "value:test>", "parseCBS with embedded function works");
        var func = findCBS(scopes[0], "#cbsTest")[0].substr("value:test>".length);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(func)(3) , 30, "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span").length, 3, "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[0], "text:title", "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[1], "text:description", "parseCBS with embedded function works");
        assert.equal(findCBS(scopes[0], ".cbsTestClass span")[2], "isEnabled:valid", "parseCBS with embedded function works");

        resetTest();


        scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsContainer{' +
                'style.display:test;'+
                    '->input{value:name};'+
                    '->.details{'+
                    '->.ageInput{value:age};'+
                    '->.addressInput{value:address}'+
                    '};'+
                    '->.col1, col2, col3{' +
                    "text:title"+
                    '};'+
                    '->p1, p2{' +
                    "->c1, c2{" +
                    "value:data"+
                    "};" +
                '};'+
            '}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.CBSLoader.test.parseCBSInDocument()
            .done(function(texts){
                scopes = scope.CBSLoader.test.getScopes(texts, false);
            });

        assert.notEqual(findCBS(scopes[0], "#cbsContainer"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer").length, 1, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer")[0], "style.display:test", "parseCBS with inner cbs blocks");
        assert.notEqual(findCBS(scopes[0], "#cbsContainer input"), undefined, "parseCBS with inner cbs blocks");
        assert.notEqual(findCBS(scopes[0], "#cbsContainer .details .ageInput"), undefined,"parseCBS with inner cbs blocks");
        assert.notEqual(findCBS(scopes[0], "#cbsContainer .details .addressInput"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer .col1, col2, col3"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer .col1, col2, col3"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer .col1,#cbsContainer col2,#cbsContainer col3")[0], "text:title", "parseCBS with inner cbs blocks");

        assert.notEqual(findCBS(scopes[0], "#cbsContainer p1 c1,#cbsContainer p2 c1,#cbsContainer p1 c2,#cbsContainer p2 c2"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS(scopes[0], "#cbsContainer p1 c1,#cbsContainer p2 c1,#cbsContainer p1 c2,#cbsContainer p2 c2")[0], "value:data", "parseCBS with inner cbs blocks");
        resetTest();
    });


    global.QUnit.asyncTest("private.CBSLoader.Loading CBS From File", function (assert) {
        expect(9);

        var cbsFileScriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs" src="CBSLoader.test.cbs">');
        headNode.appendChild(cbsFileScriptBlock);
        var cbsScriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(cbsScriptBlock);

        scope.CBSLoader.test.parseCBSInDocument()
            .done(function(texts){
                try{
                    var scopes = scope.CBSLoader.test.getScopes(texts, false);
                    assert.equal(findCBS(scopes[0], "#cbsTest") !== null, true, "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], "#cbsTest").length, 3, "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], "#cbsTest")[1].substr(0, "checked:gender>".length), "checked:gender>", "parseCBS from stand along CBS file");
                    var func = findCBS(scopes[0], "#cbsTest")[1].substr("checked:gender>".length);
                    assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("m") , true, "parseCBS from stand along CBS file");
                    assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("f") , false, "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], ".cbsTestClass span").length, 3, "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], ".cbsTestClass span")[0], "text:title", "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], ".cbsTestClass span")[1], "text:description", "parseCBS from stand along CBS file");
                    assert.equal(findCBS(scopes[0], ".cbsTestClass span")[2], "isEnabled:valid", "parseCBS from stand along CBS file");
                }
                finally{
                    headNode.removeChild(cbsFileScriptBlock);
                    headNode.removeChild(cbsScriptBlock);
                    global.QUnit.start();
                }
            },
            function (err) {
                global.console.log(err);
                global.QUnit.start();
            });
    });


    global.QUnit.test( "private.CBSLoader.applyCBS", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#userNameInput{text:name;} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var div =  global.KnotTestUtility.parseHTML('<div>' +
            '<input type="text" id="userNameInput" binding="isEnabled:isActivated;style-background:age>{return value<=18?\'red\':\'green\';}"/>' +
            '<input type="password" id="userPasswordInput" binding="isEnabled:isActivated"/>' +
            '</div>');
        testDiv.appendChild(div);
        var input = document.querySelector("#userNameInput");

        scope.CBSLoader.test.parseCBSInDocument()
            .done(function(texts){
                var scopes = scope.CBSLoader.test.getScopes(texts, false);
                scope.CBSLoader.test.applyCBS(scopes);
            });
        assert.equal(input.__knot.options !== null, true, "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0] !== null, true, "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0].leftAP.description, "text", "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0].rightAP.description, "name", "check whether the options in CBS is applied");

        assert.equal(input.__knot.options[1] !== null, true, "check whether the on-node options is applied");
        assert.equal(input.__knot.options[1].leftAP.description, "isEnabled", "check whether the on-node options is applied");
        assert.equal(input.__knot.options[1].rightAP.description, "isActivated", "check whether the on-node options is applied");

        var lastKnot = input.__knot.options.length-1;

        assert.equal(lastKnot !== null, true, "check whether the on-node options is applied");
        assert.equal(input.__knot.options[lastKnot].leftAP.description, "style-background", "check whether the on-node options is applied");
        assert.equal(input.__knot.options[lastKnot].rightAP.description, "age", "check whether the on-node options is applied");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(10), "red", "check whether the on-node options is applied. check embedded function");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(30), "green", "check whether the on-node options is applied. check embedded function");

        var passwordInput = document.querySelector("#userPasswordInput");
        assert.equal(passwordInput.__knot!==null && passwordInput.__knot.options!== null, true, "check whether the embedded options is applied");
        assert.equal(passwordInput.__knot.options[0].leftAP.description, "isEnabled", "check whether the embedded options is applied");
        assert.equal(passwordInput.__knot.options[0].rightAP.description, "isActivated", "check whether the embedded options is applied");

        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
    });



    global.QUnit.asyncTest("private.CBSLoader.Apply Private CBS From File", function (assert) {
        expect(4);
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"><input type="text" class="nameInput"></div>');
        bodyNode.appendChild(testDiv);
        scope.CBSLoader.loadCBSPackage("CBSPackage.test.cbs")
            .done(function(){
                try{

                    var template = scope.HTMLKnotBuilder.templates.nameInputTemplate;
                    assert.equal(template !== null, true, "Apply private CBS");
                    assert.equal(template.children[0].__knot.options.length, 1, "Apply private CBS");
                    assert.equal(template.children[0].__knot.options[0].leftAP.description, "value", "Apply private CBS");
                    var i = testDiv.querySelector(".nameInput");
                    assert.equal(!i.__knot, true, "Apply private CBS. The selector in private scope should not effect anything outside.");
                }
                finally{
                    bodyNode.removeChild(testDiv);
                    global.QUnit.start();
                }
            },
            function (err) {
                bodyNode.removeChild(testDiv);
                global.console.log(err);
                global.QUnit.start();
            });
    });


})(window);