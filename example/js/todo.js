window.dataModel = {
    todoList:[{title:" learn knot.js", isDone:true}, {title:" build a knot.js app", isDone:false}],
    remaining:0
};

//update the remaining items number
function updateRemaining() {
    dataModel.remaining = dataModel.todoList.filter(function (t) {return !t.isDone;}).length;
}

//add new item
function addNewItem() {
    dataModel.todoList.push({title:document.querySelector("input[type=text]").value, isDone:false});
    document.querySelector("input[type=text]").value = "";
    updateRemaining();
}

//archive item
function archive() {
    for(var i=dataModel.todoList.length-1;i>=0;i--) {
        if(dataModel.todoList[i].isDone) {
            dataModel.todoList.splice(i, 1);
        }
    }
}

updateRemaining();