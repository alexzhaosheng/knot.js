(function(){
    //refresh page before executing test to get better result.
    //use hash to keep the status.

    Knot.setHashFormat(["times", "action",
                        "knotCreate", "knotSetValue", "knotRemove",
                        "knotBatchCreate", "knotBatchSetValue",  "knotBatchRemove",
                        "jqueryCreate", "jquerySetValue", "jqueryRemove"],
                    "/");

    var _initialAction;
    var hashObject = Knot.getKnotVariant("$hash");

    window.knotModel={};

    function generateData(){
        var res=  [];
        for(var i=0; i<$("#testTimes").val(); i++){
            res.push({
                text: "To do item " + i,
                value:Math.floor( Math.random()*10000),
                isCompleted:false});
        }
        return res;
    }

    function run(index){
        $("#runningMessage").text("Prepare to run " + _tests[index]);
        Knot.setKnotVariant("$hash.action", _tests[index]);
        window.location.reload();
    }

    var _tests = ["jquery", "knotjs", "knotjs_batch"];

    function onTestFinish(){
        var index = _tests.indexOf(_initialAction);
        if(index < _tests.length-1){
            run(index+1);
        }
        else{
            hashObject.action = null;
            $("#runningMessage").text("Done");
        }
    }

    function runTest(callback){
        var start = window.performance.now();
        callback();
        return Math.round((window.performance.now()-start));
    }

    var _isCompleted = false;
    function changeValue(){
        _isCompleted = !_isCompleted;
        var arr = window.knotModel.dataList;
        if(_initialAction === "knotjs" || _initialAction === "knotjs_batch"){
            for(var i=0; i<arr.length; i++){
                arr[i].isCompleted = _isCompleted;
                arr[i].value = Math.floor(Math.random()*10000);
            }
        }
        else{
            $("#jqueryList").children()
                .each(function(i, t){
                    if(_isCompleted){
                        $(t).addClass("completed");
                    }
                    else{
                        $(t).removeClass("completed");
                    }
                    $(t).find("span").eq(1).text(Math.floor( Math.random()*10000));
                });
        }
    }

    function testChangeValue(onFinish){
        var setCount = 0;
        var totalCost = 0;
        var func = function(){
            totalCost += runTest(changeValue);
            setCount ++;
            if(setCount < 10){
                setTimeout(func, 500);
            }
            else{
                onFinish(totalCost);
            }
        };
        setTimeout(func, 500);
    }

    function doKnotTest(v, onFinished, batch) {
        $("#runningMessage").text("Knot create...");
        var cost = runTest(function(){
            if(batch){
                window.knotModel.dataList = v;
            }
            else{
                window.knotModel.dataList = [];
                for (var i = 0; i < v.length; i++) {
                    window.knotModel.dataList.push(v[i]);
                }
            }
        });
        if(batch){
            hashObject.knotBatchCreate = cost;
        }
        else{
            hashObject.knotCreate = cost;
        }

        $("#runningMessage").text("Knot " + (batch?"batch":"")+ " set value...");
        testChangeValue(function(totalCost){
            if(batch){
                hashObject.knotBatchSetValue = totalCost;
            }
            else{
                hashObject.knotSetValue = totalCost;
            }

            cost = runTest(function(){
                if(batch){
                    window.knotModel.dataList = [];
                }
                else{
                   window.knotModel.dataList.splice(0, window.knotModel.dataList.length);
                }
            });
            if(batch){
                hashObject.knotBatchRemove = cost;
            }
            else{
                hashObject.knotRemove = cost;
            }
            onFinished();
        });
    }
    function doJQueryTest(v, onFinished) {
        var cost = runTest(function(){
            $("#runningMessage").text("JQuery create...");
            for (var i = 0; i < v.length; i++) {
                var n = $('<div class="toDoItem"><span></span><span></span></div>').appendTo("#jqueryList");
                n.children().eq(0).text(v[i].text);
                n.children().eq(1).text(v[i].value);
            }
        });
        hashObject.jqueryCreate = cost;
        $("#runningMessage").text("JQuery set value...");
        testChangeValue(function(totalCost){
            hashObject.jquerySetValue = totalCost;
            cost = runTest(function(){
                $("#jqueryList").children().remove();
//                for(var i = $("#jqueryList").children().length-1; i>=0; i--){
//                    $("#jqueryList").children().eq(0).remove();
//                }
            });
            hashObject.jqueryRemove = cost;
            onFinished();
        });
    }

    function doAngularTest(v, onFinished){

    }

    Knot.ready(function(){
         doAngularTest(generateData(2), function(){});
        return;
//        $("#tt").click(function(){
//            hashObject.times = 2;
//            doKnotTest(generateData(), function(){});
//        });
//
//        return;

        $("#testButton").click(function(){
            hashObject.knotBatchCreate = hashObject.knotBatchSetValue = hashObject.knotBatchRemove
                = hashObject.knotCreate = hashObject.knotSetValue = hashObject.knotRemove
                = hashObject.jqueryCreate = hashObject.jquerySetValue = hashObject.jqueryRemove = 0;
            run(0);
        });

        _initialAction = Knot.getKnotVariant("$hash.action");
        if(_initialAction){
            $("#runningMessage").text("wait...");
            var v = generateData();
            setTimeout(function(){
                $("#runningMessage").text("running...");

                if(_initialAction === "knotjs"){
                    doKnotTest(v, onTestFinish);
                }
                else if(_initialAction === "knotjs_batch"){
                    doKnotTest(v, onTestFinish, true);
                }
                else if(_initialAction === "angularjs"){
                    doAngularTest(v, onTestFinish);
                }
                else{
                    doJQueryTest(v, onTestFinish);
                }

                if(_initialAction === "test_knotjs")
                    Knot.setKnotVariant("$hash.action", "test_jquery");
                else
                    Knot.setKnotVariant("$hash.action", null);
            }, 1000);
        }
        else{
            $("#changeValueButton").hide();
        }
    });


})();


function TodoCtrl($scope) {
    $scope.todos = [
        {text:'learn angular', isCompleted:true},
        {text:'build an angular app', isCompleted:false}];


    $scope.remaining = function() {
        var count = 0;
        angular.forEach($scope.todos, function(todo) {
            count += todo.done ? 1 : 0;
        });
        return count;
    };

    $scope.archive = function() {
        var oldTodos = $scope.todos;
        $scope.todos = [];
        angular.forEach(oldTodos, function(todo) {
            if (!todo.done) $scope.todos.push(todo);
        });
    };
}