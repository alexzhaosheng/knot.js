(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();

    var bodyNode = document.getElementsByTagName("body")[0];
    var headNode = document.getElementsByTagName("head")[0];


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

        scope.CBSLoader.loadGlobalScope();
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
        global.KnotTestUtility.clearAllKnotInfo(document.body);
    });

    global.QUnit.test( "private.HTMLKnotBuilder.AP with complex selector ", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#cssSelectorInput{' +
            'value:#(.cssSelectorTest>input:last-child).value>{return "Hello "+ value;}} \r\n'+
            '#testSelectorSpan{' +
                'textContent:#(#testSelectorDiv>input).value;'+
            '}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var node =  global.KnotTestUtility.parseHTML(
            '<div>' +
                '<div class="cssSelectorTest">' +
                    '<input id="cssSelectorInput" type="text">' +
                    '<input type="text">' +
                '</div>'+
                '<span id="testSelectorSpan"></span>'+
                '<div id="testSelectorDiv">' +
                    '<input type="text">' +
                '</div>'+
            '</div>'
            );
        testDiv.appendChild(node);

        scope.CBSLoader.loadGlobalScope();
        scope.HTMLKnotBuilder.bind();

        var cssInput1 = document.querySelector("#cssSelectorInput");
        var cssInput2 = document.querySelector(".cssSelectorTest>input:last-child");
        cssInput1.value = "einstein";
        global.KnotTestUtility.raiseDOMEvent(cssInput1, "change");
        assert.equal(cssInput2.value, "einstein", "test complex css selector");

        cssInput2.value = "satoshi";
        global.KnotTestUtility.raiseDOMEvent(cssInput2, "change");
        assert.equal(cssInput1.value, "Hello satoshi", "test complex css selector");

        var span = document.querySelector("#testSelectorSpan");
        var t2Input = document.querySelector("#testSelectorDiv>input");
        t2Input.value = "laozi";
        global.KnotTestUtility.raiseDOMEvent(t2Input, "change");
        assert.equal(span.textContent, "laozi", "test complex CSS selector");


        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);
        global.KnotTestUtility.clearAllKnotInfo(document.body);
    });

    global.QUnit.test( "private.HTMLKnotBuilder.template", function ( assert ) {

        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var templateDiv = global.KnotTestUtility.parseHTML('<div id="userTemplate" knot-template-id="userTemplateId"><span></span>.<span></span></div>');
        testDiv.appendChild(templateDiv);

        var template2 = global.KnotTestUtility.parseHTML('<select id="templateTest2"><option knot-template/></select>');
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
            scope.CBSLoader.loadGlobalScope();
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

            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });


    global.QUnit.test("private.HTMLKnotBuilder.template selector", function (assert) {
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
            '#selectedUser{content[templateSelector:@/testTemplateSelector]:selectedUser}'+
            '#userList{foreach[templateSelector:@/testTemplateSelector]:userList}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var latestThisPointer;
        global.testTemplateSelector = function (value) {
            latestThisPointer = this;
            if(value.isEastAsianName) {
               return "easternUserTemplate";
            }
            else {
                return "westernUserTemplate";
            }
        };

        scope.CBSLoader.loadGlobalScope();
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
            assert.equal(list.childNodes[0].childNodes[3].textContent, "west", "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.firstName, "check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.lastName, "check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[3].textContent, "east asia", "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.firstName,"check the nodes created by template selector. should be created from easternUserTemplate");
            assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.lastName, "check the nodes created by template selector. should be created from easternUserTemplate");

            assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName, "check the nodes created by template selector. should be created from westernUserTemplate");
            assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName, "check the nodes created by template selector. should be created from westernUserTemplate");

            assert.equal(selected.childNodes[0].childNodes[0].innerText, newton.firstName, "check the node created by template selector with content binding. should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[2].innerText, newton.lastName, "check the node created by template selector with content binding.should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].textContent,"west", "check the node created by template selector with content binding.should be created from westernUserTemplate");

            global.templateTestData.selectedUser = laoZi;
            assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.firstName, "check the node created by template selector with content binding. should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.lastName, "check the node created by template selector with content binding.should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].textContent, "east asia", "check the node created by template selector with content binding.should be created from easternUserTemplate");


            assert.equal(latestThisPointer, selected, "check this pointer in template selector");
        }
        finally{
        delete global.templateTestData;

        scope.HTMLKnotBuilder.clear();
        headNode.removeChild(scriptBlock);
        bodyNode.removeChild(testDiv);

        global.KnotTestUtility.clearAllKnotInfo(document.body);
    }
    });

    global.QUnit.test("private.HTMLKnotBuilder.dynamic template", function (assert) {
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
            '#selectedUser{content[template:@/testTemplateMethod]:selectedUser}'+
            '#userList{foreach[template:@/testTemplateMethod]:userList}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var latestThisPointer;
        global.testTemplateMethod = function (value) {
            latestThisPointer = this;
            if(value.isEastAsianName) {
                return scope.HTMLKnotBuilder.createFromTemplate("easternUserTemplate", value);
            }
            else {
                return scope.HTMLKnotBuilder.createFromTemplate("westernUserTemplate", value);
            }
        };

        scope.CBSLoader.loadGlobalScope();
        scope.HTMLKnotBuilder.bind();

        try{
            var list =document.querySelector("#userList");
            var selected =document.querySelector("#selectedUser");

            var einstein = {firstName:"albert", lastName:"einstein"};
            var satoshi = {firstName:"satoshi", lastName:"nakamoto", isEastAsianName:true};
            var laoZi={firstName:"dan", lastName:"li", isEastAsianName:true};
            var newton={firstName:"issac", lastName:"newton"};
            global.templateTestData = {userList:[einstein, satoshi, laoZi, newton], selectedUser:newton};

            assert.equal(list.childNodes.length, 4, "check the nodes created by dynamic template by foreach binding");
            assert.equal(list.childNodes[0].childNodes[0].innerText, einstein.firstName, "check the nodes created by dynamic template. should be created from westernUserTemplate");
            assert.equal(list.childNodes[0].childNodes[2].innerText, einstein.lastName, "check the nodes created by dynamic template. should be created from westernUserTemplate");
            assert.equal(list.childNodes[0].childNodes[3].textContent, "west", "check the nodes created by dynamic template. should be created from westernUserTemplate");

            assert.equal(list.childNodes[1].childNodes[2].innerText, satoshi.firstName, "check the nodes created by dynamic template. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[0].innerText, satoshi.lastName, "check the nodes created by dynamic template. should be created from easternUserTemplate");
            assert.equal(list.childNodes[1].childNodes[3].textContent, "east asia", "check the nodes created by dynamic template. should be created from westernUserTemplate");

            assert.equal(list.childNodes[2].childNodes[2].innerText, laoZi.firstName,"check the nodes created by dynamic template. should be created from easternUserTemplate");
            assert.equal(list.childNodes[2].childNodes[0].innerText, laoZi.lastName, "check the nodes created by dynamic template. should be created from easternUserTemplate");

            assert.equal(list.childNodes[3].childNodes[0].innerText, newton.firstName, "check the nodes created by dynamic template. should be created from westernUserTemplate");
            assert.equal(list.childNodes[3].childNodes[2].innerText, newton.lastName, "check the nodes created by dynamic template. should be created from westernUserTemplate");

            assert.equal(selected.childNodes[0].childNodes[0].innerText, newton.firstName, "check the node created by dynamic template with content binding. should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[2].innerText, newton.lastName, "check the node created by dynamic template with content binding.should be created from westernUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].textContent,"west", "check the node created by dynamic template with content binding.should be created from westernUserTemplate");

            global.templateTestData.selectedUser = laoZi;
            assert.equal(selected.childNodes[0].childNodes[2].innerText, laoZi.firstName, "check the node created by dynamic template with content binding. should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[0].innerText, laoZi.lastName, "check the node created by dynamic template with content binding.should be created from easternUserTemplate");
            assert.equal(selected.childNodes[0].childNodes[3].textContent, "east asia", "check the node created by dynamic template with content binding.should be created from easternUserTemplate");


            assert.equal(latestThisPointer, selected, "check this pointer in dynamic template");
        }
        finally{
            delete global.templateTestData;

            scope.HTMLKnotBuilder.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);

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

        scope.CBSLoader.loadGlobalScope();
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

        scope.CBSLoader.loadGlobalScope();
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
            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });


    global.QUnit.test("private.HTMLKnotBuilder.Global Object Knots", function (assert) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);

        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '/knotTestData{ name:/knotTestData2.value}'+
            '#div1{dataContext:/knotTestData;} \r\n'+
            '#userNameInput{value:name;} \r\n'+
            '</script>');
        headNode.appendChild(scriptBlock);

        var node =  global.KnotTestUtility.parseHTML(
            '<div id="div1">' +
                '<input type="text" id="userNameInput" />'+
            '</div>');
        testDiv.appendChild(node);

        scope.CBSLoader.loadGlobalScope();
        scope.HTMLKnotBuilder.bind();

        var input = node.querySelector("input");

        global.knotTestData = {name:"alex"};
        global.knotTestData2 = {value:"xyz"};
        try{
            assert.equal(global.knotTestData.name, "xyz", "Test bind to global object");
            assert.equal(input.value, "xyz", "Test bind to global object");
            input.value = "zzz";
            KnotTestUtility.raiseDOMEvent(input, "change");
            assert.equal(global.knotTestData.name, "zzz", "Test bind to global object");
            assert.equal(input.value, "zzz", "Test bind to global object");
            assert.equal(global.knotTestData2.value, "zzz", "Test bind to global object");

            global.knotTestData2.value = "aaa";
            assert.equal(global.knotTestData.name, "aaa", "Test bind to global object");
            assert.equal(input.value, "aaa", "Test bind to global object");
            assert.equal(global.knotTestData2.value, "aaa", "Test bind to global object");


            global.knotTestData2 = {value : "xxx"};
            assert.equal(global.knotTestData.name, "xxx", "Test bind to global object");
            assert.equal(input.value, "xxx", "Test bind to global object");
            assert.equal(global.knotTestData2.value, "xxx", "Test bind to global object");

            scope.HTMLKnotBuilder.clear();
            global.knotTestData2.value = "123";
            assert.equal(global.knotTestData.name, "xxx", "Test clear binding on global object");
            assert.equal(input.value, "xxx", "Test clear binding on global object");
            assert.equal(global.knotTestData2.value, "123", "Test clear binding on global object");


            //todo: add global object knots in private scope test
        }
        finally{
            scope.HTMLKnotBuilder.clear();
            headNode.removeChild(scriptBlock);
            bodyNode.removeChild(testDiv);
            global.KnotTestUtility.clearAllKnotInfo(document.body);
        }
    });
})(window);
