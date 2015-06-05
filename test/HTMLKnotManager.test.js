(function(){
    var scope = Knot.getPrivateScope();

    var findCBS = function(selector){
        return scope.HTMLKnotManager.normalizedCBS[selector];
    }

    var bodyNode = document.getElementsByTagName("body")[0];
    var headNode = document.getElementsByTagName("head")[0];
    QUnit.test( "private.HTMLKnotManager.CBS", function( assert ) {
        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);


        var resetTest = function(){
            headNode.removeChild(scriptBlock);
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
        headNode.appendChild(scriptBlock);

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

        var cbsFileScriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs" src="HTMLKnotManager.test.cbs">');
        headNode.appendChild(cbsFileScriptBlock);
        var cbsScriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(cbsScriptBlock);

        scope.HTMLKnotManager.parseCBS().done(function(){
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

                headNode.removeChild(cbsFileScriptBlock);
                headNode.removeChild(cbsScriptBlock);
                scope.HTMLKnotManager.normalizedCBS = [];
                QUnit.start();
            },
            function(err){
                Console.writeln(err);
                QUnit.start();
            });;
    });

    QUnit.test( "private.HTMLKnotManager.applyCBS", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#userNameInput{text:name;} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var input =  KnotTestUtility.parseHTML('<input type="text" id="userNameInput" binding="isEnabled:isActivated;style-background:age>{return value<=18?\'red\':\'green\';}"/>');
        testDiv.appendChild(input);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        assert.equal(input.__knot.options != null, true);
        assert.equal(input.__knot.options[0] != null, true);
        assert.equal(input.__knot.options[0].leftAP.name, "text");
        assert.equal(input.__knot.options[0].rightAP.name, "name");

        assert.equal(input.__knot.options[1] != null, true);
        assert.equal(input.__knot.options[1].leftAP.name, "isEnabled");
        assert.equal(input.__knot.options[1].rightAP.name, "isActivated");

        var lastKnot = input.__knot.options.length-1;

        assert.equal(lastKnot != null, true);
        assert.equal(input.__knot.options[lastKnot].leftAP.name, "style-background");
        assert.equal(input.__knot.options[lastKnot].rightAP.name, "age");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(10), "red");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(30), "green");

        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
    });

    QUnit.test( "private.HTMLKnotManager.updateDataContext", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#div1{dataContext:/knotTestData;} \r\n'+
            '#userNameInput{value:name;} \r\n'+
            '#div2{dataContext:user}\r\n'+
            '#div3{dataContext:group}\r\n'+
            '#groupNameInput{value:title;} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var node =  KnotTestUtility.parseHTML(
            '<div id="div1">' +
                '<div id="div2">'+
                    '<input type="text" id="userNameInput" />'+
                '</div>' +
                '<div>' +
                    '<div id="div3"> <input type="text" id="groupNameInput"/> </div>' +
                '</div>' +
            '</div>');
        testDiv.appendChild(node);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();

        var data = {user:{name:"alex"}, group:{title:"t1"}};
        window.knotTestData = data;

        scope.HTMLKnotManager.init();


        var userNameInput = document.querySelector("#userNameInput");
        assert.equal(userNameInput.__knot.dataContext, data.user);

        var groupTitleInput = document.querySelector("#groupNameInput");
        assert.equal(groupTitleInput.__knot.dataContext, data.group);

        assert.equal(userNameInput.value, "alex");
        assert.equal(groupTitleInput.value, "t1");

        userNameInput.value = "satoshi";
        raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi");
        data.user.name = "einstein";
        assert.equal(userNameInput.value, "einstein");


        var oldUserObj = data.user;
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "turing");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman");
        userNameInput.value = "satoshi nakamoto";
        raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto");

        oldUserObj.name = "laozi";
        assert.equal(data.user.name, "satoshi nakamoto");
        assert.equal(userNameInput.value, "satoshi nakamoto");



    });

    function raiseDOMEvent(element, eventType){
        var event;
        if (document.createEvent) {
            event = document.createEvent("HTMLEvents");
            event.initEvent(eventType, true, true);
        } else {
            event = document.createEventObject();
            event.eventType = eventType;
        }

        event.eventName = eventType;
        if (document.createEvent) {
            element.dispatchEvent(event);
        } else {
            element.fireEvent("on" + event.eventType, event);
        }
    }
})();
