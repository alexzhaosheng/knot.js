
function findInTree(entity, nodes, parent) {
    var res = null;
    travelTree(nodes, parent, function (node, parent, isLeader) {
        if(node === entity) {
            res = {parent:parent, node:node, isLeader:isLeader};
            return true;
        }
        return false;
    });

    return res;
}

function travelTree(nodes, parent, callback) {
    if(!nodes) {
        return false;
    }

    for(var i=0; i<nodes.length; i++) {
        if(callback(nodes[i], parent, false)) {
            return true;
        }

        if(nodes[i].leader) {
            if (callback(nodes[i].leader, nodes[i], true)) {
                return true;
            }
        }

        if(travelTree(nodes[i].children, nodes[i], callback)) {
            return true;
        }
    }
}

function addDNDSrcSupport(node, data, startCallback, doneCallback, cancelCallback){
    node.className += " dragSource";
    node.dragSourceListener = {
        getData:function(){return data;},

        dragStart: function(pos){
            window.mafiaSystem.inDragging = {
                data:data, pos:pos
            };
            if(startCallback) {
                startCallback();
            }
        },

        dragMove:function(pos){
            window.mafiaSystem.inDragging.pos = pos;
        },

        notifyDropIsDone:function(){
            window.mafiaSystem.inDragging = null;
            if(doneCallback) {
                doneCallback();
            }
        },

        notifyDropIsCancelled:function(){
            window.mafiaSystem.inDragging = null;
            if(cancelCallback) {
                cancelCallback();
            }
        }
    };
}

function addDNDTargetSupport(node, dragTestCallback, dropCallback){
    if(node.className.indexOf("dropTarget") < 0){
        node.className += " dropTarget";
    }
    node.dropListener = {
        test:dragTestCallback,
        drop:dropCallback
    };
}

function updateGangsInfo(){
    for(var i=0; i< mafiaSystem.gangs.length; i++){
        var businessCount = 0;
        var handCount = 0;
        travelTree(mafiaSystem.gangs[i].children, null, function(e, p, l){
            if(e.type) {
                businessCount++;
            }
            else {
                handCount++;
            }
        });
        if(mafiaSystem.gangs[i].leader) {
            handCount++;
        }
        mafiaSystem.gangs[i].businessCount = businessCount;
        mafiaSystem.gangs[i].handsCount = handCount;
    }
}


function animateNewEntity(data, target) {
    window.mafiaSystem.inAnimation = data;
    $(target).css("opacity", 0);
    $("#animationVisual")
        .css("top", $("#editArea").offset().top + 100 - $("body").scrollTop())
        .css("left", $("#editArea").offset().left - $("body").scrollLeft())
        .css("width", $(target).width()).css("height", $(target).height())
        .animate({left: $(target).offset().left, top: $(target).offset().top}, 600, function () {
            $(target).css("opacity", 1);
            window.mafiaSystem.inAnimation = null;
            data.isNew = false;
        });
}
window.mafiaSystem = {
    gangs:null,

    freeEntities:[],

    selected:null,

    inDragging: null,

    inAnimation: null,

    nodeContentTemplateSelector: function (data) {
        var template;
        if(data.sex === "male") {
            template = "manTemplate";
        }
        else if(data.sex === "female") {
            template = "womanTemplate";
        }
        else if(data.type === "white-business") {
            template = "whiteBusinessTemplate";
        }
        else if(data.type === "black-business") {
            template = "blackBusinessTemplate";
        }
        else if(data.type === "gang") {
            template = "gangTemplate";
        }
        return window.Knot.Advanced.createFromTemplate(template, data, this);
    },

    editorTemplateSelector: function (data) {
        var template;
        if(data.sex === "male") {
            template = "manEditorTemplate";
        }
        else if(data.sex === "female") {
            template = "womanEditorTemplate";
        }
        else if(data.type === "white-business") {
            template = "whiteBusinessEditorTemplate";
        }
        else if(data.type === "black-business") {
            template = "blackBusinessEditorTemplate";
        }
        else if(data.type === "gang") {
            template = "gangEditorTemplate";
        }
        return window.Knot.Advanced.createFromTemplate(template, data, this);
    },

    onSelectClicked: function () {
        if(window.mafiaSystem.selected){
            var r = Knot.getErrorStatusInformation($("#editArea")[0]);
            if(r.length > 0){
                alert("Please fix the error first.");
                $(r[0].node).focus();
                return;
            }

            if(window.mafiaSystem.selected.isNew){
                commitNewEntity();
            }
        }
        var sender = this;
        travelTree(window.mafiaSystem.gangs, null, function (node) {
            node.isSelected = (sender === node);
        });
        for(var i=0; i<window.mafiaSystem.freeEntities.length; i++){
            window.mafiaSystem.freeEntities[i].isSelected = (sender === window.mafiaSystem.freeEntities[i]);
        }
        window.mafiaSystem.selected = this;
    },

    onRemoveSelectedLeader:function(organization){

    },

    onTreeChildAdded: function(node, data){
        if(!data.sex){
            addDNDTargetSupport($(node).find(".people .dropTarget")[0], function(droppedData){
                    if(!droppedData.sex){
                        window.mafiaSystem.inDragging.message = "You can only assign a human as leader.";
                        return false;
                    }
                    else{
                        window.mafiaSystem.inDragging.message = "Drop to assign \""+ droppedData.name + "\" as the leader of " + data.title;
                        return true;
                    }
                },
                function(dropData){
                    data.leader = dropData;
                    dropData.isInSystem = true;
                });

            addDNDTargetSupport(node, function(droppedData){
                    return droppedData.type !== "gang";
                },
                function(droppedData){
                    if(!data.children){
                        data.children = [droppedData];
                    }
                    else{
                        data.children.push(droppedData);
                    }
                    droppedData.isInSystem = true;
                });
        }

        if(data.type !== "gang"){
            var index, parent, isLeader;
            addDNDSrcSupport(node, data, function(){
                    var r = findInTree(data, window.mafiaSystem.gangs, null);
                    if(r){
                        parent = r.parent;
                        isLeader = r.isLeader;
                        if(isLeader) {
                            parent.leader = null;
                        }
                        else {
                            index = parent.children.indexOf(data);
                            parent.children.splice(index, 1);
                        }
                    }
                    else{
                        parent = index = isLeader = undefined;
                    }
                },
                function(){},
                function(){
                    if(parent){
                        if(isLeader){
                            parent.leader = data;
                        }
                        else{
                            parent.children.splice(index, 0, data);
                        }
                    }
                });
        }

        if(data.isNew){
            animateNewEntity(data, node);
        }
        else{
            $(node).css("opacity", 1);
        }

        updateGangsInfo();
    },

    onFreeEntityAdded:function(node, data){
        var index;
        addDNDSrcSupport(node, data,
            function(){
                index = window.mafiaSystem.freeEntities.indexOf(data);
                window.mafiaSystem.freeEntities.splice(index, 1);
            },
            function(){},
            function(){
                window.mafiaSystem.freeEntities.splice(index, 0, data);
            });

        if(data.isNew){
            animateNewEntity(data, node);
        }
        else{
            $(node).css("opacity", 1);
        }

        updateGangsInfo();
    },

    pipes:{
        checkTitle: function (value) {
            if(!value || value.length<3) {
                throw new Error("Title must be longer than 3 chars!");
            }
            else if(value.length > 50) {
                throw new Error("Title must not be longer than 50 chars!");
            }
            return value.trim();
        },
        checkName:function(value){
            if(!value || value.length<3) {
                throw new Error("Name must be longer than 3 chars!");
            }
            else if(value.length > 50) {
                throw new Error("Name must not be longer than 50 chars!");
            }
            value = value.trim();
            var sec = value.split(" ").filter(function(t){return t;});
            if(sec.length < 2){
                throw new Error("Must input the first name and last name(split with space)");
            }
            return sec.join(" ");
        },
        checkNumber: function (value) {
            value = Number(value);
            if(isNaN(value)) {
                throw new Error("Invalid number!");
            }
            return value;
        },
        toMoneyStr: function(value){
            if(value === null || typeof(value) === undefined || isNaN(Number(value))) {
                return "";
            }
            return "$"+ Number(value).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
        }
    }
};


$(document).ready(function(){
    addDNDTargetSupport($("#editArea .dropTarget")[0],
        function(data){
            if(!data.sex){
                window.mafiaSystem.inDragging.message = "You can only assign a human as leader.";
                return false;
            }
            else{
                window.mafiaSystem.inDragging.message = "Drop to assign \""+ data.name + "\" as the leader of " + window.mafiaSystem.selected.title;
                return true;
            }
        },
        function(data){
            window.mafiaSystem.selected.leader = data;
            data.isInSystem = true;
        }
    );

    addDNDTargetSupport($("#freeEntities")[0],
        function(data){
            if(!data.isInSystem){
                window.mafiaSystem.inDragging.message = null;
                return false;
            }
            if(!(!data.children || data.children.length === 0)){
                window.mafiaSystem.inDragging.message = "Remove all of the children of " +(data.title || data.name) + " first.";
                return false;
            }
            if(data.leader){
                window.mafiaSystem.inDragging.message = "Remove the leader of " +(data.title || data.name) + " first.";
                return false;
            }

            window.mafiaSystem.inDragging.message = "Drop to remove " + (data.title || data.name) + " from the family tree.";
            return true;
        },
        function(data){
            data.isInSystem = false;
            window.mafiaSystem.freeEntities.push(data);
        });
});

function newEntity(){
    var type = $("#newEntityType").val();
    if(type === "male" || type==="female"){
        window.mafiaSystem.selected = {sex:type, isNew:true};
    }
    else{
        window.mafiaSystem.selected = {type:type, isNew:true};
    }
}

function commitNewEntity(){
    var r = Knot.getErrorStatusInformation($("#editArea")[0]);
    if(r.length > 0){
        alert("Please fix the error first.");
        $(r[0].node).focus();
        return;
    }

    var e = window.mafiaSystem.selected;
    window.mafiaSystem.inAnimation = e;
    if(e.type==="gang"){
        window.mafiaSystem.gangs.push(e);
    }
    else{
        window.mafiaSystem.freeEntities.push(e);
    }

    window.mafiaSystem.selected = null;
}

function cancelNew(){
    window.mafiaSystem.selected = null;
}