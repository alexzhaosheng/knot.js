(function(window){
    var scope = window.Knot.getPrivateScope();

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

        assert.equal(findCBS("#cbsTest") != null, true, "parseCBS works");
        assert.equal(findCBS("#cbsTest").length, 1, "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span").length, 3, "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[0], "text:title", "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[1], "text:description", "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid", "parseCBS works");


        resetTest();

        scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test>{return value*10;}} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();

        assert.equal(findCBS("#cbsTest") != null, true, "parseCBS with embedded function works");
        assert.equal(findCBS("#cbsTest").length, 1, "parseCBS with embedded function works");
        assert.equal(findCBS("#cbsTest")[0].substr(0, "value:test>".length), "value:test>", "parseCBS with embedded function works");
        var func = findCBS("#cbsTest")[0].substr("value:test>".length);
        assert.equal(scope.GlobalSymbolHelper.getSymbol(func)(3) , 30, "parseCBS with embedded function works");
        assert.equal(findCBS(".cbsTestClass span").length, 3, "parseCBS with embedded function works");
        assert.equal(findCBS(".cbsTestClass span")[0], "text:title", "parseCBS with embedded function works");
        assert.equal(findCBS(".cbsTestClass span")[1], "text:description", "parseCBS with embedded function works");
        assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid", "parseCBS with embedded function works");

        resetTest();
    });


    QUnit.asyncTest("private.HTMLKnotManager.Loading CBS From File", function(assert){
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
                assert.equal(findCBS("#cbsTest") != null, true, "parseCBS from stand along CBS file");
                assert.equal(findCBS("#cbsTest").length, 3, "parseCBS from stand along CBS file");
                assert.equal(findCBS("#cbsTest")[1].substr(0, "checked:gender>".length), "checked:gender>", "parseCBS from stand along CBS file");
                var func = findCBS("#cbsTest")[1].substr("checked:gender>".length);
                assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("m") , true, "parseCBS from stand along CBS file");
                assert.equal(scope.GlobalSymbolHelper.getSymbol(func)("f") , false, "parseCBS from stand along CBS file");
                assert.equal(findCBS(".cbsTestClass span").length, 3, "parseCBS from stand along CBS file");
                assert.equal(findCBS(".cbsTestClass span")[0], "text:title", "parseCBS from stand along CBS file");
                assert.equal(findCBS(".cbsTestClass span")[1], "text:description", "parseCBS from stand along CBS file");
                assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid", "parseCBS from stand along CBS file");

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

        var div =  KnotTestUtility.parseHTML('<div>' +
            '<input type="text" id="userNameInput" binding="isEnabled:isActivated;style-background:age>{return value<=18?\'red\':\'green\';}"/>' +
            '<input type="password" id="userPasswordInput" binding="isEnabled:isActivated"/>' +
            '</div>');
        testDiv.appendChild(div);
        input = document.querySelector("#userNameInput");

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        assert.equal(input.__knot.options != null, true, "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0] != null, true, "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0].leftAP.description, "text", "check whether the options in CBS is applied");
        assert.equal(input.__knot.options[0].rightAP.description, "name", "check whether the options in CBS is applied");

        assert.equal(input.__knot.options[1] != null, true, "check whether the on-node options is applied");
        assert.equal(input.__knot.options[1].leftAP.description, "isEnabled", "check whether the on-node options is applied");
        assert.equal(input.__knot.options[1].rightAP.description, "isActivated", "check whether the on-node options is applied");

        var lastKnot = input.__knot.options.length-1;

        assert.equal(lastKnot != null, true, "check whether the on-node options is applied");
        assert.equal(input.__knot.options[lastKnot].leftAP.description, "style-background", "check whether the on-node options is applied");
        assert.equal(input.__knot.options[lastKnot].rightAP.description, "age", "check whether the on-node options is applied");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(10), "red", "check whether the on-node options is applied. check embedded function");
        assert.equal(scope.GlobalSymbolHelper.getSymbol(input.__knot.options[lastKnot].rightAP.pipes[0])(30), "green", "check whether the on-node options is applied. check embedded function");

        var passwordInput = document.querySelector("#userPasswordInput");
        assert.equal(passwordInput.__knot!=null && passwordInput.__knot.options!= null, true, "check whether the embedded options is applied");
        assert.equal(passwordInput.__knot.options[0].leftAP.description, "isEnabled", "check whether the embedded options is applied");
        assert.equal(passwordInput.__knot.options[0].rightAP.description, "isActivated", "check whether the embedded options is applied");

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
        assert.equal(userNameInput.__knot.dataContext, data.user, "updateDataContext works");

        var groupTitleInput = document.querySelector("#groupNameInput");
        assert.equal(groupTitleInput.__knot.dataContext, data.group, "updateDataContext works");

        assert.equal(userNameInput.value, "alex", "updateDataContext works");
        assert.equal(groupTitleInput.value, "t1", "updateDataContext works");

        userNameInput.value = "satoshi";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi", "change value on html element and check the binding object");
        data.user.name = "einstein";
        assert.equal(userNameInput.value, "einstein", "change value on html element and check the binding object");


        var oldUserObj = data.user;
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "turing", "change value on object then check the binding html element");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman", "change value on object then check the binding html element");
        userNameInput.value = "satoshi nakamoto";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto", "change value on html element and check the binding object");

        oldUserObj.name = "laozi";
        assert.equal(data.user.name, "satoshi nakamoto", "change value on old object, should has no effect to the relevant element");
        assert.equal(userNameInput.value, "satoshi nakamoto", "change value on old object, should has no effect to the relevant element");


        data = {user:{name:"einstein"}, group:{title:"tx"}};
        window.knotTestData = data;
        assert.equal(userNameInput.value, "einstein", "change to another object and check the relevant values on html element");
        assert.equal(groupTitleInput.value, "tx", "change to another object and check the relevant values on html element");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman", "change to another object and check the relevant values on html element");
        userNameInput.value = "satoshi nakamoto";
        KnotTestUtility.raiseDOMEvent(userNameInput, "change", "change to another object and check the relevant values on html element");
        assert.equal(data.user.name, "satoshi nakamoto", "change to another object and check the relevant values on html element");

        data.user = null;
        assert.equal(userNameInput.value, "", "change to null object");
        data.user = {name:"laozi"};
        assert.equal(userNameInput.value, "laozi", "change from null object");

        userNameInput.value = "";
        scope.HTMLKnotManager.clear();
        data.user.name = "feyman";
        assert.equal(userNameInput.value, "", "clear works");
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "", "clear works");
        data = {user:{name:"einstein"}, group:{title:"tx"}};
        window.knotTestData = data;
        assert.equal(userNameInput.value, "", "clear works");


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
        assert.equal(list.childNodes.length, 3, "check the nodes created by knot by foreach binding");
        assert.equal(list.childNodes[0].childNodes[0].innerText, einstein.firstName, "check the nodes created by knot with foreach binding");
        assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "check the nodes created by knot with foreach binding");
        assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.firstName, "check the nodes created by knot with foreach binding");
        assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.lastName, "check the nodes created by knot with foreach binding");
        assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.firstName, "check the nodes created by knot with foreach binding");
        assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.lastName, "check the nodes created by knot with foreach binding");

        assert.equal(selected.childNodes[0].childNodes[0].innerText, satoshi.firstName, "check the node created by knot with content binding");
        assert.equal(selected.childNodes[0].childNodes[2].innerText, satoshi.lastName, "check the node created by knot with content binding");


        window.templateTestData.userList.push(newton);
        assert.equal(list.childNodes.length, 4, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName, "change array and the change reflects to html elements");

        window.templateTestData.userList.splice(1,1);
        assert.equal(list.childNodes.length, 3, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[1].childNodes[0].innerText, laoZi.firstName, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[1].childNodes[2].innerText, laoZi.lastName, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[2].childNodes[0].innerText, newton.firstName, "change array and the change reflects to html elements");
        assert.equal(list.childNodes[2].childNodes[2].innerText, newton.lastName, "change array and the change reflects to html elements");

        window.templateTestData.userList = null;
        assert.equal(list.childNodes.length, 0, "set list to null");
        window.templateTestData.userList = [newton, einstein];
        assert.equal(list.childNodes.length, 2, "set list from null");
        assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName, "set list from null");
        assert.equal(list.childNodes[0].childNodes[2].innerText, newton.lastName, "set list from null");
        assert.equal(list.childNodes[1].childNodes[0].innerText, einstein.firstName, "set list from null");
        assert.equal(list.childNodes[1].childNodes[2].innerText, einstein.lastName, "set list from null");

        newton.firstName = "Newton";
        assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName, "change value on item, the change reflect to html elements");
        newton.firstName = "newton";

        window.templateTestData.userList.push(satoshi);
        window.templateTestData.userList.push(laoZi);

        assert.equal(list.childNodes.length, 4, "test sort array");
        assert.equal(list.childNodes[2].childNodes[0].innerText, satoshi.firstName, "test sort array");
        assert.equal(list.childNodes[2].childNodes[2].innerText, satoshi.lastName, "test sort array");

        window.templateTestData.userList.sort(function(a,b){return a.firstName> b.firstName?1:-1});
        assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "test sort array");
        assert.equal(list.childNodes[3].childNodes[2].innerText, satoshi.lastName, "test sort array");


        //test duplicated element in array
        window.templateTestData.userList.push(newton);
        assert.equal(list.childNodes.length, 5, "duplicated items in array");
        assert.equal(list.childNodes[4].childNodes[0].innerText, newton.firstName, "duplicated items in array");
        assert.equal(list.childNodes[4].childNodes[2].innerText, newton.lastName, "duplicated items in array");


        window.templateTestData.selectedUser =laoZi;
        assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.firstName, "change data binding by content");
        assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.lastName, "change data binding by content");

        window.templateTestData.selectedUser =null;
        assert.equal(selected.childNodes.length, 0, "change data binding by content");

        delete window.templateTestData;

        scope.HTMLKnotManager.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];

        KnotTestUtility.clearAllKnotInfo(document.body);
    });

    QUnit.test("private.HTMLKnotManager.templateSelector", function(assert){
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = KnotTestUtility.parseHTML('<div>' +
            '<div id="westernUserTemplate" knot-template ><span></span> <span></span><p>west</p></div>' +
            '<div id="easternUserTemplate" knot-template ><span></span> <span></span><p>east asia</p></div>' +
            '</div>');
        testDiv.appendChild(templateDiv);

        testDiv.appendChild(KnotTestUtility.parseHTML('<div><div id="selectedUser"></div><div id="userList"></div></div>'));

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/templateTestData;}'+
            '#westernUserTemplate>span:first-child{innerText:firstName}'+
            '#westernUserTemplate>span:last-of-type{innerText:lastName}'+
            '#easternUserTemplate>span:first-child{innerText:lastName}'+
            '#easternUserTemplate>span:last-of-type{innerText:firstName}'+
            '#selectedUser{content</testTemplateSelector:selectedUser}'+
            '#userList{foreach</testTemplateSelector:userList}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        window.testTemplateSelector = function(value){
            if(value.isEastAsianName)
                return scope.HTMLKnotManager.createFromTemplate("easternUserTemplate");
            else
                return scope.HTMLKnotManager.createFromTemplate("westernUserTemplate");
        }

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        scope.HTMLKnotManager.processTemplateNodes();
        scope.HTMLKnotManager.bind();

        try{
            var list =document.querySelector("#userList");
            var selected =document.querySelector("#selectedUser");

            var einstein = {firstName:"albert", lastName:"einstein"};
            var satoshi = {firstName:"satoshi", lastName:"nakamoto", isEastAsianName:true};
            var laoZi={firstName:"dan", lastName:"li", isEastAsianName:true};
            var newton={firstName:"issac", lastName:"newton"};
            window.templateTestData = {userList:[einstein, satoshi, laoZi, newton], selectedUser:newton};

            assert.equal(list.childNodes.length, 4, "check the nodes created by template selector by foreach binding");
            assert.equal(list.childNodes[0].childNodes[0].innerText, einstein.firstName, "check the nodes created by template selector. should be created from westernUserTemplate");
            assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "check the nodes created by template selector. should be created from westernUserTemplate");
            assert.equal(list.childNodes[0].childNodes[3].innerText, "west", "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.firstName, "check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.lastName, "check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[3].innerText, "east asia", "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.firstName,"check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.lastName, "check the nodes created by template selector. should be created from easternUserTemplate");

            assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName, "check the nodes created by template selector. should be created from westernUserTemplate");
            assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName, "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(selected.childNodes[0].childNodes[0].innerText, newton.firstName, "check the node created by template selector with content binding. should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[2].innerText, newton.lastName, "check the node created by template selector with content binding.should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].innerText,"west", "check the node created by template selector with content binding.should be created from westernUserTemplate");

            window.templateTestData.selectedUser = laoZi;
            assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.firstName, "check the node created by template selector with content binding. should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.lastName, "check the node created by template selector with content binding.should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].innerText, "east asia", "check the node created by template selector with content binding.should be created from easternUserTemplate");
        }
        finally{
            delete window.templateTestData;

            scope.HTMLKnotManager.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);
            scope.HTMLKnotManager.normalizedCBS = [];

            KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });

    QUnit.test( "private.HTMLKnotManager.event", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var bt = KnotTestUtility.parseHTML('<input id="testButton" type="button" value="test"/>');
        testDiv.appendChild(bt);

        var latestSender;
        window.eventTestOnMouseOver = function(arg, sender){
            latestSender = sender;
        };

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/eventTestData;}'+
            '#testButton{@click:@{window.eventClickedCount++;window.latestThisPointer=this;};@mouseover:@/eventTestOnMouseOver}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        scope.HTMLKnotManager.processTemplateNodes();
        scope.HTMLKnotManager.bind();

        window.eventClickedCount = 0;
        var testButton = document.querySelector("#testButton");
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 1, "click event works");
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 2, "click event works");
        assert.equal(window.latestThisPointer, window, "click event works, this pointer in handler is correct");

        window.eventTestData = {name:"test"};
        KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(window.eventClickedCount, 4, "click event works, this pointer in handler is correct");
        assert.equal(window.latestThisPointer, window.eventTestData, "click event works, this pointer in handler is correct");

        KnotTestUtility.raiseDOMEvent(testButton, "mouseover");
        assert.equal(latestSender, testButton, "sender of the event is correct");

        scope.HTMLKnotManager.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];
        KnotTestUtility.clearAllKnotInfo(document.body);
    });

    QUnit.test( "private.HTMLKnotManager.bind to exception", function( assert ) {
        var testDiv =  KnotTestUtility.parseHTML('<div style="opacity: 0"></div>')
        bodyNode.appendChild(testDiv);
        var testElements = KnotTestUtility.parseHTML('<div><input id="testInput" type="text" value="test"/><div id="validateMsg"></div></div>');
        testDiv.appendChild(testElements);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/exceptionTestData;}'+
            '#testInput{value>{if(value.length<4) throw new Error("short");if(value.length>8) throw new Error("long");}:name}'+
            '#validateMsg{innerText:!#testInput.value>{if(value)return value.message; else return "";}; style.color:!#testInput.value>{if(value)return "red"; else return "black";}} '+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotManager.parseCBS();
        scope.HTMLKnotManager.applyCBS();
        scope.HTMLKnotManager.processTemplateNodes();
        scope.HTMLKnotManager.bind();

        window.exceptionTestData = {name:"test"};

        var testInput = document.querySelector("#testInput");
        var msg = document.querySelector("#validateMsg");

        testInput.value = "bi";
        KnotTestUtility.raiseDOMEvent(testInput, "change");
        assert.equal(msg.innerText, "short", "binding to exception works");
        assert.equal(msg.style.color, "red", "binding to exception works");

        testInput.value = "bingoando";
        KnotTestUtility.raiseDOMEvent(testInput, "change");
        assert.equal(msg.innerText, "long", "binding to exception works");
        assert.equal(msg.style.color, "red", "binding to exception works");

        var status = [];
        scope.HTMLAPProvider.getErrorStatusInformation(bodyNode, status);
        assert.equal(status.length, 1, "getErrorStatusInformation works");
        assert.equal(status[0].node, testInput, "getErrorStatusInformation works");
        assert.equal(status[0].accessPointName, "value", "getErrorStatusInformation works");
        assert.equal(status[0].error.message, "long", "getErrorStatusInformation works");

        testInput.value = "bingo";
        KnotTestUtility.raiseDOMEvent(testInput, "change");
        assert.equal(msg.innerText, "", "error status is cleared");
        assert.equal(msg.style.color, "black", "error status is cleared");

        status = [];
        scope.HTMLAPProvider.getErrorStatusInformation(bodyNode, status);
        assert.equal(status.length, 0, "error status is cleared");

        scope.HTMLKnotManager.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotManager.normalizedCBS = [];
        KnotTestUtility.clearAllKnotInfo(document.body);
    });
})((function() {
        return this;
    })());
