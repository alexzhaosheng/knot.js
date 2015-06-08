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
        scope.HTMLKnotManager.bind();

        var data = {user:{name:"alex"}, group:{title:"t1"}};
        window.knotTestData = data;

        var userNameInput = document.querySelector("#userNameInput");
        assert.equal(userNameInput.__knot.dataContext, data.user);

        var groupTitleInput = document.querySelector("#groupNameInput");
        assert.equal(groupTitleInput.__knot.dataContext, data.group);

        assert.equal(userNameInput.value, "alex");
        assert.equal(groupTitleInput.value, "t1");

        userNameInput.value = "satoshi";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi");
        data.user.name = "einstein";
        assert.equal(userNameInput.value, "einstein");


        var oldUserObj = data.user;
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "turing");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman");
        userNameInput.value = "satoshi nakamoto";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto");

        oldUserObj.name = "laozi";
        assert.equal(data.user.name, "satoshi nakamoto");
        assert.equal(userNameInput.value, "satoshi nakamoto");


        data = {user:{name:"einstein"}, group:{title:"tx"}};
        window.knotTestData = data;
        assert.equal(userNameInput.value, "einstein");
        assert.equal(groupTitleInput.value, "tx");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman");
        userNameInput.value = "satoshi nakamoto";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto");

        data.user = null;
        assert.equal(userNameInput.value, "");
        data.user = {name:"laozi"};
        assert.equal(userNameInput.value, "laozi");

        userNameInput.value = "";
        scope.HTMLKnotManager.clear();
        data.user.name = "feyman";
        assert.equal(userNameInput.value, "");
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "");
        data = {user:{name:"einstein"}, group:{title:"tx"}};
        window.knotTestData = data;
        assert.equal(userNameInput.value, "");


        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];
        KnotTestUtility.clearAllKnotInfo(document.body);
    });

    QUnit.test( "private.HTMLKnotManager.template", function( assert ) {

        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = KnotTestUtility.parseHTML('<div id="userTemplate" knot-template ><span></span>.<span></span></div>');
        testDiv.appendChild(templateDiv);

        testDiv.appendChild(KnotTestUtility.parseHTML('<div><div id="selectedUser"></div><div id="userList"></div></div>'));

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/templateTestData;}'+
            '#userTemplate>span:first-child{innerText:firstName}'+
            '#userTemplate>span:last-child{innerText:lastName}'+
            '#selectedUser{content<userTemplate:selectedUser}'+
            '#userList{foreach<userTemplate:userList}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        scope.HTMLKnotManager.processTemplateNodes();
        scope.HTMLKnotManager.bind();

        var list =document.querySelector("#userList");
        var selected =document.querySelector("#selectedUser");

        var einstein = {firstName:"albert", lastName:"einstein"};
        var satoshi = {firstName:"satoshi", lastName:"nakamoto"};
        var laoZi={firstName:"dan", lastName:"li"};
        var newton={firstName:"issac", lastName:"newton"};
        window.templateTestData = {userList:[einstein, satoshi, laoZi], selectedUser:satoshi};
        assert.equal(list.childNodes.length, 3);
        assert.equal(list.childNodes[0].childNodes[0].innerText, einstein.firstName);
        assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName);
        assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.firstName);
        assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.lastName);
        assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.firstName);
        assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.lastName);

        assert.equal(selected.childNodes[0].childNodes[0].innerText, satoshi.firstName);
        assert.equal(selected.childNodes[0].childNodes[2].innerText, satoshi.lastName);


        window.templateTestData.userList.push(newton);
        assert.equal(list.childNodes.length, 4);
        assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName);
        assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName);

        window.templateTestData.userList.splice(1,1);
        assert.equal(list.childNodes.length, 3);
        assert.equal(list.childNodes[1].childNodes[0].innerText, laoZi.firstName);
        assert.equal(list.childNodes[1].childNodes[2].innerText, laoZi.lastName);
        assert.equal(list.childNodes[2].childNodes[0].innerText, newton.firstName);
        assert.equal(list.childNodes[2].childNodes[2].innerText, newton.lastName);

        window.templateTestData.userList = null;
        assert.equal(list.childNodes.length, 0);
        window.templateTestData.userList = [newton, einstein];
        assert.equal(list.childNodes.length, 2);
        assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName);
        assert.equal(list.childNodes[0].childNodes[2].innerText, newton.lastName);
        assert.equal(list.childNodes[1].childNodes[0].innerText, einstein.firstName);
        assert.equal(list.childNodes[1].childNodes[2].innerText, einstein.lastName);

        newton.firstName = "Newton";
        assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName);
        newton.firstName = "newton";

        window.templateTestData.userList.push(satoshi);
        window.templateTestData.userList.push(laoZi);

        assert.equal(list.childNodes.length, 4);
        assert.equal(list.childNodes[2].childNodes[0].innerText, satoshi.firstName);
        assert.equal(list.childNodes[2].childNodes[2].innerText, satoshi.lastName);

        window.templateTestData.userList.sort(function(a,b){return a.firstName> b.firstName?1:-1});
        assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName);
        assert.equal(list.childNodes[3].childNodes[2].innerText, satoshi.lastName);


        //test duplicated element in array
        window.templateTestData.userList.push(newton);
        assert.equal(list.childNodes.length, 5);
        assert.equal(list.childNodes[4].childNodes[0].innerText, newton.firstName);
        assert.equal(list.childNodes[4].childNodes[2].innerText, newton.lastName);


        window.templateTestData.selectedUser =laoZi;
        assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.firstName);
        assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.lastName);

        window.templateTestData.selectedUser =null;
        assert.equal(selected.childNodes.length, 0);

        scope.HTMLKnotManager.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];

        KnotTestUtility.clearAllKnotInfo(document.body);
    });

    QUnit.test( "private.HTMLKnotManager.event", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = KnotTestUtility.parseHTML('<input id="testButton" type="button" value="test"/>');
        testDiv.appendChild(templateDiv);

        var latestSender;
        window.eventTestOnMouseOver = function(arg, sender){
            latestSender = sender;
        };

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/eventTestData;}'+
            '#testButton{@click:{window.eventClickedCount++;window.latestThisPointer=this;};@mouseover:/eventTestOnMouseOver}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        scope.HTMLKnotManager.processTemplateNodes();
        scope.HTMLKnotManager.bind();

        window.eventClickedCount = 0;
        var testButton = document.querySelector("#testButton");
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 1);
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 2);
        assert.equal(window.latestThisPointer, window);

        window.eventTestData = {name:"test"};
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 4);
        assert.equal(window.latestThisPointer, window.eventTestData);

        KnotTestUtility.raiseDOMEvent(testButton, "mouseover");
        assert.equal(latestSender, testButton);

        scope.HTMLKnotManager.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];
        KnotTestUtility.clearAllKnotInfo(document.body);
    });

})();
