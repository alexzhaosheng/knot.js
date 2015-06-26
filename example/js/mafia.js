(function (window) {
    "use strict";

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
        node.className += " dropTarget";
        node.dropListener = {
            test:dragTestCallback,
            drop:dropCallback
        };
    }


    window.mafiaSystem = {
        gangs:null,

        freeEntities:[],

        selected:null,

        inDragging: null,

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
            var r = Knot.getErrorStatusInformation($("#editArea")[0]);
            if(r.length > 0){
                alert("Please fix the errors first.");
                $(r[0].node).focus();
                return;
            }
            else{
                var sender = this;
                travelTree(window.mafiaSystem.gangs, null, function (node) {
                    node.isSelected = (sender === node);
                });
                for(var i=0; i<window.mafiaSystem.freeEntities.length; i++){
                    window.mafiaSystem.freeEntities[i].isSelected = (sender === window.mafiaSystem.freeEntities[i]);
                }
                window.mafiaSystem.selected = this;
            }
        },

        onRemoveSelectedLeader:function(organization){

        },

        onTreeChildAdded: function(node, data){
            if(!data.sex){
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
                    });
            }

            if(data.type !== "gang"){
                var index, parent, isLeader;
                addDNDSrcSupport(node, data, function(){
                        var r = findInTree(data, window.mafiaSystem.gangs, null);
                        if(r){
                            parent = r.parent;
                            index = parent.children.indexOf(data);
                            isLeader = r.isLeader;
                            if(isLeader) {
                                parent.leader = null;
                            }
                            else {
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


})(window);