(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();

    var findCBS = function (selector) {
        return scope.HTMLKnotBuilder.publicCBS[selector];
    };

    var bodyNode = document.getElementsByTagName("body")[0];
    var headNode = document.getElementsByTagName("head")[0];

    global.QUnit.test( "private.HTMLKnotBuilder.CBS", function ( assert ) {
        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);


        var resetTest = function () {
            headNode.removeChild(scriptBlock);
            scope.HTMLKnotBuilder.publicCBS = {};
        };


        scope.HTMLKnotBuilder.parseCBS();

        assert.equal(findCBS("#cbsTest") !== null, true, "parseCBS works");
        assert.equal(findCBS("#cbsTest").length, 1, "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span").length, 3, "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[0], "text:title", "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[1], "text:description", "parseCBS works");
        assert.equal(findCBS(".cbsTestClass span")[2], "isEnabled:valid", "parseCBS works");


        resetTest();

        scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test>{return value*10;}} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotBuilder.parseCBS();

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


        scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsContainer{' +
                'style.display:test;'+
                '=>input{value:name};'+
                '=>.details{'+
                    '=>.ageInput{value:age};'+
                    '=>.addressInput{value:address}'+
                '};'+
                '=>.col1, col2, col3{' +
                    "text:title"+
                '};'+
                '=>p1, p2{' +
                    "=>c1, c2{" +
                        "value:data"+
                    "};" +
                '};'+
            '}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotBuilder.parseCBS();

        assert.notEqual(findCBS("#cbsContainer"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer").length, 1, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer")[0], "style.display:test", "parseCBS with inner cbs blocks");
        assert.notEqual(findCBS("#cbsContainer input"), undefined, "parseCBS with inner cbs blocks");
        assert.notEqual(findCBS("#cbsContainer .details .ageInput"), undefined,"parseCBS with inner cbs blocks");
        assert.notEqual(findCBS("#cbsContainer .details .addressInput"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer .col1, col2, col3"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer .col1, col2, col3"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer .col1,#cbsContainer col2,#cbsContainer col3")[0], "text:title", "parseCBS with inner cbs blocks");

        assert.notEqual(findCBS("#cbsContainer p1 c1,#cbsContainer p2 c1,#cbsContainer p1 c2,#cbsContainer p2 c2"), undefined, "parseCBS with inner cbs blocks");
        assert.equal(findCBS("#cbsContainer p1 c1,#cbsContainer p2 c1,#cbsContainer p1 c2,#cbsContainer p2 c2")[0], "value:data", "parseCBS with inner cbs blocks");
        resetTest();
    });


    global.QUnit.asyncTest("private.HTMLKnotBuilder.Loading CBS From File", function (assert) {
        expect(9);

        var cbsFileScriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs" src="HTMLKnotBuilder.test.cbs">');
        headNode.appendChild(cbsFileScriptBlock);
        var cbsScriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cbsTest{value:test} \r\n'+
            '.cbsTestClass span{text:title} \r\n'+
            '.cbsTestClass span{text:description; isEnabled:valid} \r\n'+
            '</script>');
        headNode.appendChild(cbsScriptBlock);

        scope.HTMLKnotBuilder.parseCBS().done(function () {
                assert.equal(findCBS("#cbsTest") !== null, true, "parseCBS from stand along CBS file");
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
                scope.HTMLKnotBuilder.publicCBS = {};
                global.QUnit.start();
            },
            function (err) {
                global.console.log(err);
                global.QUnit.start();
            });
    });

    global.QUnit.test( "private.HTMLKnotBuilder.applyCBS", function ( assert ) {
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

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
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

    global.QUnit.test( "private.HTMLKnotBuilder.updateDataContext", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#div1{dataContext:/knotTestData;} \r\n'+
            '#userNameInput{value:name;} \r\n'+
            '#div2{dataContext:user}\r\n'+
            '#div3{dataContext:group}\r\n'+
            '#groupNameInput{value:title;} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var node =  global.KnotTestUtility.parseHTML(
            '<div id="div1">' +
                '<div id="div2">'+
                    '<input type="text" id="userNameInput" />'+
                '</div>' +
                '<div>' +
                    '<div id="div3"> <input type="text" id="groupNameInput"/> </div>' +
                '</div>' +
            '</div>');
        testDiv.appendChild(node);

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
        scope.HTMLKnotBuilder.bind();

        var data = {user:{name:"alex"}, group:{title:"t1"}};
        global.knotTestData = data;

        var userNameInput = document.querySelector("#userNameInput");
        assert.equal(userNameInput.__knot.dataContext, data.user, "updateDataContext works");

        var groupTitleInput = document.querySelector("#groupNameInput");
        assert.equal(groupTitleInput.__knot.dataContext, data.group, "updateDataContext works");

        assert.equal(userNameInput.value, "alex", "updateDataContext works");
        assert.equal(groupTitleInput.value, "t1", "updateDataContext works");

        userNameInput.value = "satoshi";
        global.KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi", "change value on html element and check the binding object");
        data.user.name = "einstein";
        assert.equal(userNameInput.value, "einstein", "change value on html element and check the binding object");


        var oldUserObj = data.user;
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "turing", "change value on object then check the binding html element");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman", "change value on object then check the binding html element");
        userNameInput.value = "satoshi nakamoto";
        global.KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto", "change value on html element and check the binding object");

        oldUserObj.name = "laozi";
        assert.equal(data.user.name, "satoshi nakamoto", "change value on old object, should has no effect to the relevant element");
        assert.equal(userNameInput.value, "satoshi nakamoto", "change value on old object, should has no effect to the relevant element");


        data = {user:{name:"einstein"}, group:{title:"tx"}};
        global.knotTestData = data;
        assert.equal(userNameInput.value, "einstein", "change to another object and check the relevant values on html element");
        assert.equal(groupTitleInput.value, "tx", "change to another object and check the relevant values on html element");
        data.user.name = "feynman";
        assert.equal(userNameInput.value, "feynman", "change to another object and check the relevant values on html element");
        userNameInput.value = "satoshi nakamoto";
        global.KnotTestUtility.raiseDOMEvent(userNameInput, "change");
        assert.equal(data.user.name, "satoshi nakamoto", "change to another object and check the relevant values on html element");

        data.user = null;
        assert.equal(userNameInput.value, "", "change to null object");
        data.user = {name:"laozi"};
        assert.equal(userNameInput.value, "laozi", "change from null object");

        userNameInput.value = "";
        scope.HTMLKnotBuilder.clear();
        data.user.name = "feyman";
        assert.equal(userNameInput.value, "", "clear works");
        data.user = {name:"turing"};
        assert.equal(userNameInput.value, "", "clear works");
        data = {user:{name:"einstein"}, group:{title:"tx"}};
        global.knotTestData = data;
        assert.equal(userNameInput.value, "", "clear works");



        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotBuilder.publicCBS = {};
        global.KnotTestUtility.clearAllKnotInfo(document.body);
    });

    global.QUnit.test( "private.HTMLKnotBuilder.AP with complex selector ", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cssSelectorInput{' +
            'value:#(.cssSelectorTest>input:last-child).value>{return "Hello "+ value;}} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var node =  global.KnotTestUtility.parseHTML(
            '<div class="cssSelectorTest">' +
                '<input id="cssSelectorInput" type="text">' +
                '<input type="text">' +
                '</div>'
            );
        testDiv.appendChild(node);

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
        scope.HTMLKnotBuilder.bind();

        var cssInput1 = document.querySelector("#cssSelectorInput");
        var cssInput2 = document.querySelector(".cssSelectorTest>input:last-child");
        cssInput1.value = "einstein";
        global.KnotTestUtility.raiseDOMEvent(cssInput1, "change");
        assert.equal(cssInput2.value, "einstein", "test complex css selector");

        cssInput2.value = "satoshi";
        global.KnotTestUtility.raiseDOMEvent(cssInput2, "change");
        assert.equal(cssInput1.value, "Hello satoshi", "test complex css selector");


        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotBuilder.publicCBS = {};
        global.KnotTestUtility.clearAllKnotInfo(document.body);
    });

    global.QUnit.test( "private.HTMLKnotBuilder.template", function ( assert ) {

        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = global.KnotTestUtility.parseHTML('<div id="userTemplate" knot-template-id="userTemplateId"><span></span>.<span></span></div>');
        testDiv.appendChild(templateDiv);

        var template2 = global.KnotTestUtility.parseHTML('<selec id="templateTest2"><option knot-template/></div>');
        testDiv.appendChild(template2);

        testDiv.appendChild(global.KnotTestUtility.parseHTML('<div><div id="selectedUser"></div><div id="userList"></div></div>'));

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/templateTestData;}'+
            '#userTemplate>span:first-child{innerText:firstName}'+
            '#userTemplate>span:last-child{innerText:lastName}'+
            '#selectedUser{content[template:userTemplateId]:selectedUser}'+
            '#userList{foreach[template:userTemplateId]:userList}'+
            '#templateTest2{foreach:optionsList}'+
            '#templateTest2 option{value:name;text:name}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        try{
            scope.HTMLKnotBuilder.parseCBS();
            scope.HTMLKnotBuilder.applyCBS();
            scope.HTMLKnotBuilder.processTemplateNodes();
            scope.HTMLKnotBuilder.bind();

            var list =document.querySelector("#userList");
            var selected =document.querySelector("#selectedUser");

            var einstein = {firstName:"albert", lastName:"einstein"};
            var satoshi = {firstName:"satoshi", lastName:"nakamoto"};
            var laoZi={firstName:"dan", lastName:"li"};
            var newton={firstName:"issac", lastName:"newton"};
            global.templateTestData = {userList:[einstein, satoshi, laoZi], selectedUser:satoshi};
            assert.equal(list.childNodes.length, 3, "check the nodes created by knot by foreach binding");
            assert.equal(list.childNodes[0].childNodes[0].innerText, einstein.firstName, "check the nodes created by knot with foreach binding");
            assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "check the nodes created by knot with foreach binding");
            assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.firstName, "check the nodes created by knot with foreach binding");
            assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.lastName, "check the nodes created by knot with foreach binding");
            assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.firstName, "check the nodes created by knot with foreach binding");
            assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.lastName, "check the nodes created by knot with foreach binding");

            assert.equal(selected.childNodes[0].childNodes[0].innerText, satoshi.firstName, "check the node created by knot with content binding");
            assert.equal(selected.childNodes[0].childNodes[2].innerText, satoshi.lastName, "check the node created by knot with content binding");


            global.templateTestData.userList.push(newton);
            assert.equal(list.childNodes.length, 4, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName, "change array and the change reflects to html elements");

            global.templateTestData.userList.splice(1,1);
            assert.equal(list.childNodes.length, 3, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[1].childNodes[0].innerText, laoZi.firstName, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[1].childNodes[2].innerText, laoZi.lastName, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[2].childNodes[0].innerText, newton.firstName, "change array and the change reflects to html elements");
            assert.equal(list.childNodes[2].childNodes[2].innerText, newton.lastName, "change array and the change reflects to html elements");

            global.templateTestData.userList = null;
            assert.equal(list.childNodes.length, 0, "set list to null");
            global.templateTestData.userList = [newton, einstein];
            assert.equal(list.childNodes.length, 2, "set list from null");
            assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName, "set list from null");
            assert.equal(list.childNodes[0].childNodes[2].innerText, newton.lastName, "set list from null");
            assert.equal(list.childNodes[1].childNodes[0].innerText, einstein.firstName, "set list from null");
            assert.equal(list.childNodes[1].childNodes[2].innerText, einstein.lastName, "set list from null");

            newton.firstName = "Newton";
            assert.equal(list.childNodes[0].childNodes[0].innerText, newton.firstName, "change value on item, the change reflect to html elements");
            newton.firstName = "newton";

            global.templateTestData.userList.push(satoshi);
            global.templateTestData.userList.push(laoZi);

            assert.equal(list.childNodes.length, 4, "test sort array");
            assert.equal(list.childNodes[2].childNodes[0].innerText, satoshi.firstName, "test sort array");
            assert.equal(list.childNodes[2].childNodes[2].innerText, satoshi.lastName, "test sort array");

            global.templateTestData.userList.sort(function (a,b) {return a.firstName> b.firstName?1:-1;});
            assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "test sort array");
            assert.equal(list.childNodes[3].childNodes[2].innerText, satoshi.lastName, "test sort array");


            //test duplicated element in array
            global.templateTestData.userList.push(newton);
            assert.equal(list.childNodes.length, 5, "duplicated items in array");
            assert.equal(list.childNodes[4].childNodes[0].innerText, newton.firstName, "duplicated items in array");
            assert.equal(list.childNodes[4].childNodes[2].innerText, newton.lastName, "duplicated items in array");


            global.templateTestData.selectedUser =laoZi;
            assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.firstName, "change data binding by content");
            assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.lastName, "change data binding by content");

            global.templateTestData.selectedUser =null;
            assert.equal(selected.childNodes.length, 0, "change data binding by content");

            global.templateTestData.optionsList = [{name:"einstein"}, {name:"satoshi"}, {name:"laozi"}];
            assert.equal(template2.children.length, 3, "embedded template works");
            assert.equal(template2.children[0].value, "einstein", "embedded template works");

        }
        finally{
            delete global.templateTestData;

            scope.HTMLKnotBuilder.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);
            scope.HTMLKnotBuilder.publicCBS = {};

            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });

    global.QUnit.test("private.HTMLKnotBuilder.templateSelector", function (assert) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = global.KnotTestUtility.parseHTML('<div>' +
            '<div id="westernUserTemplate" knot-template-id="westernUserTemplate" ><span></span> <span></span><p>west</p></div>' +
            '<div id="easternUserTemplate" knot-template-id="easternUserTemplate" ><span></span> <span></span><p>east asia</p></div>' +
            '</div>');
        testDiv.appendChild(templateDiv);

        testDiv.appendChild(global.KnotTestUtility.parseHTML('<div><div id="selectedUser"></div><div id="userList"></div></div>'));

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/templateTestData;}'+
            '#westernUserTemplate>span:first-child{innerText:firstName}'+
            '#westernUserTemplate>span:last-of-type{innerText:lastName}'+
            '#easternUserTemplate>span:first-child{innerText:lastName}'+
            '#easternUserTemplate>span:last-of-type{innerText:firstName}'+
            '#selectedUser{content[template:@/testTemplateSelector]:selectedUser}'+
            '#userList{foreach[template:@/testTemplateSelector]:userList}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var latestThisPointer;
        global.testTemplateSelector = function (value) {
            latestThisPointer = this;
            if(value.isEastAsianName) {
                return scope.HTMLKnotBuilder.createFromTemplate("easternUserTemplate", value);
            }
            else {
                return scope.HTMLKnotBuilder.createFromTemplate("westernUserTemplate", value);
            }
        };

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
        scope.HTMLKnotBuilder.processTemplateNodes();
        scope.HTMLKnotBuilder.bind();

        try{
            var list =document.querySelector("#userList");
            var selected =document.querySelector("#selectedUser");

            var einstein = {firstName:"albert", lastName:"einstein"};
            var satoshi = {firstName:"satoshi", lastName:"nakamoto", isEastAsianName:true};
            var laoZi={firstName:"dan", lastName:"li", isEastAsianName:true};
            var newton={firstName:"issac", lastName:"newton"};
            global.templateTestData = {userList:[einstein, satoshi, laoZi, newton], selectedUser:newton};

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

            global.templateTestData.selectedUser = laoZi;
            assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.firstName, "check the node created by template selector with content binding. should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.lastName, "check the node created by template selector with content binding.should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].innerText, "east asia", "check the node created by template selector with content binding.should be created from easternUserTemplate");


            assert.equal(latestThisPointer, selected, "check this pointer in template selector");
        }
        finally{
            delete global.templateTestData;

            scope.HTMLKnotBuilder.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);
            scope.HTMLKnotBuilder.publicCBS = {};

            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });

    global.QUnit.test( "private.HTMLKnotBuilder.event", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var bt = global.KnotTestUtility.parseHTML('<input id="testButton" type="button" value="test"/>');
        testDiv.appendChild(bt);

        var latestSender;
        global.eventTestOnMouseOver = function (arg, sender) {
            latestSender = sender;
        };

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/eventTestData;}'+
            '#testButton{@click:@{window.eventClickedCount++;window.latestThisPointer=this;};@mouseover:@/eventTestOnMouseOver}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
        scope.HTMLKnotBuilder.processTemplateNodes();
        scope.HTMLKnotBuilder.bind();

        global.eventClickedCount = 0;
        var testButton = document.querySelector("#testButton");
        global.KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(global.eventClickedCount, 1, "click event works");
        global.KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(global.eventClickedCount, 2, "click event works");

        global.eventTestData = {name:"test"};
        global.KnotTestUtility.raiseDOMEvent(testButton, "click");
        assert.equal(global.eventClickedCount, 4, "click event works, this pointer in handler is correct");
        assert.equal(global.latestThisPointer, global.eventTestData, "click event works, this pointer in handler is correct");

        global.KnotTestUtility.raiseDOMEvent(testButton, "mouseover");
        assert.equal(latestSender, testButton, "sender of the event is correct");

        scope.HTMLKnotBuilder.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        scope.HTMLKnotBuilder.publicCBS = {};
        global.KnotTestUtility.clearAllKnotInfo(document.body);
    });

    global.QUnit.test( "private.HTMLKnotBuilder.bind to exception", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);
        var testElements = global.KnotTestUtility.parseHTML('<div><input id="testInput" type="text" value="test"/><div id="validateMsg"></div></div>');
        testDiv.appendChild(testElements);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">' +
            'body {dataContext:/exceptionTestData;}'+
            '#testInput{value[@error:/exceptionTestOnError] >{if(value.length<4) throw new Error("short");if(value.length>8) throw new Error("long");}:name}'+
            '#validateMsg{innerText:!#testInput.value>{if(value)return value.message; else return "";}; style.color:!#testInput.value>{if(value)return "red"; else return "black";}} '+
            '</script>');
        headNode.appendChild(scriptBlock);

        scope.HTMLKnotBuilder.parseCBS();
        scope.HTMLKnotBuilder.applyCBS();
        scope.HTMLKnotBuilder.processTemplateNodes();
        scope.HTMLKnotBuilder.bind();

        try{
            var latestAP, latestError, latestTarget;
            global.exceptionTestOnError = function(ap, error){
                latestAP = ap; latestError = error; latestTarget=this;
            };

            global.exceptionTestData = {name:"test"};

            var testInput = document.querySelector("#testInput");
            var msg = document.querySelector("#validateMsg");

            testInput.value = "bi";
            global.KnotTestUtility.raiseDOMEvent(testInput, "change");
            assert.equal(msg.innerText, "short", "binding to exception works");
            assert.equal(msg.style.color, "red", "binding to exception works");
            assert.equal(latestAP, "value", "test onerror event");
            assert.equal(latestError.message, "short", "test onerror event");
            assert.equal(latestTarget, testInput, "test onerror event");

            latestAP = latestError = latestTarget = undefined;
            testInput.value = "bingoando";
            global.KnotTestUtility.raiseDOMEvent(testInput, "change");
            assert.equal(msg.innerText, "long", "binding to exception works");
            assert.equal(msg.style.color, "red", "binding to exception works");
            assert.equal(latestAP, "value", "test onerror event");
            assert.equal(latestError.message, "long", "test onerror event");
            assert.equal(latestTarget, testInput, "test onerror event");

            var status = [];
            scope.HTMLErrorAPProvider.getErrorStatusInformation(bodyNode, status);
            assert.equal(status.length, 1, "getErrorStatusInformation works");
            assert.equal(status[0].node, testInput, "getErrorStatusInformation works");
            assert.equal(status[0].accessPointName, "value", "getErrorStatusInformation works");
            assert.equal(status[0].error.message, "long", "getErrorStatusInformation works");

            latestAP = latestError = latestTarget = undefined;
            testInput.value = "bingo";
            global.KnotTestUtility.raiseDOMEvent(testInput, "change");
            assert.equal(msg.innerText, "", "error status is cleared");
            assert.equal(msg.style.color, "black", "error status is cleared");
            assert.equal(latestAP, "value", "test onerror event");
            assert.equal(latestError, undefined, "test onerror event");
            assert.equal(latestTarget, latestTarget, "test onerror event");

            status = [];
            scope.HTMLErrorAPProvider.getErrorStatusInformation(bodyNode, status);
            assert.equal(status.length, 0, "error status is cleared");


            latestAP = latestError = latestTarget = undefined;
            testInput.value = "bingox";
            global.KnotTestUtility.raiseDOMEvent(testInput, "change");
            assert.equal(msg.innerText, "", "error status is cleared");
            assert.equal(msg.style.color, "black", "error status is cleared");
            assert.equal(latestAP, undefined, "test onerror event");
            assert.equal(latestError, undefined, "test onerror event");
            assert.equal(latestTarget, undefined, "test onerror event");
        }
        finally{

            scope.HTMLKnotBuilder.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);
            scope.HTMLKnotBuilder.publicCBS = {};
            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });


    global.QUnit.asyncTest("private.HTMLKnotBuilder.Apply Private CBS From File", function (assert) {
        expect(4);

        var cbsFileScriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs" src="privateScope.test.cbs">');
        headNode.appendChild(cbsFileScriptBlock);
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"><input class="nameInput"></div>');
        bodyNode.appendChild(testDiv);


        scope.HTMLKnotBuilder.parseCBS().done(function () {
                scope.HTMLKnotBuilder.applyCBS();
                scope.HTMLKnotBuilder.processTemplateNodes();

                var template = scope.HTMLKnotBuilder.templates.nameInputTemplate;
                assert.equal(template !== null, true, "Apply private CBS");
                assert.equal(template.children[0].__knot.options.length, 1, "Apply private CBS");
                assert.equal(template.children[0].__knot.options[0].leftAP.description, "value", "Apply private CBS");
                var i = testDiv.querySelector(".nameInput");
                assert.equal(!i.__knot, true, "Apply private CBS. The selector in private scope should not effect anything outside.");

                bodyNode.removeChild(testDiv);
                headNode.removeChild(cbsFileScriptBlock);
                scope.HTMLKnotBuilder.publicCBS = {};
                scope.HTMLKnotBuilder.template = {};
                scope.HTMLKnotBuilder.privateCBSInfo = [];
                scope.HTMLKnotBuilder.privateScope = null;
                global.QUnit.start();
            },
            function (err) {
                global.console.log(err);
                global.QUnit.start();
            });
    });
})(window);
