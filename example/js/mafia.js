(function (window){
    function findInTree(entity, nodes, parent){
        var res = null;
        travelTree(nodes, parent, function (node, parent, isLeader){
            if(node == entity){
                res = {parent:parent, node:node, isLeader:isLeader}
                return true;
            }
        });

        return res;
    }

    function travelTree(nodes, parent, callback){
        if(!nodes)
            return;

        for(var i=0; i<nodes.length; i++){
            if(callback(nodes[i], parent, false))
                return true;

            if(nodes[i].leader)
                if(callback(nodes[i].leader, nodes[i], true))
                    return true;

            if(travelTree(nodes[i].children, nodes[i], callback))
                return true;
        }
    }

    window.mafiaSystem = {
        gangs:null,

        selected:null,

        nodeContentTemplateSelector: function (data){
            var template;
            if(data.sex == "male"){
                template = "manTemplate";
            }
            else if(data.sex == "female"){
                template = "womanTemplate"
            }
            else if(data.type == "white-business"){
                template = "whiteBusinessTemplate";
            }
            else if(data.type == "black-business"){
                template = "blackBusinessTemplate";
            }
            else if(data.type == "gang"){
                template = "gangTemplate";
            }
            return window.Knot.Advanced.createFromTemplate(template, data, this);
        },

        editorTemplateSelector: function (data){
            var template;
            if(data.sex == "male"){
                template = "manEditorTemplate";
            }
            else if(data.sex == "female"){
                template = "womanEditorTemplate"
            }
            else if(data.type == "white-business"){
                template = "whiteBusinessEditorTemplate";
            }
            else if(data.type == "black-business"){
                template = "blackBusinessEditorTemplate";
            }
            else if(data.type == "gang"){
                template = "gangEditorTemplate";
            }
            return window.Knot.Advanced.createFromTemplate(template, data, this);
        },

        onSelectClicked: function (){
            var sender = this;
            travelTree(window.mafiaSystem.gangs, null, function (node){
                node.isSelected = (sender == node);
            });
            window.mafiaSystem.selected = this;
        },


        pipes:{
            checkTitle: function (value){
                if(!value || value.length<3){
                    throw new Error("Title must be longer than 3 chars!")
                }
                else if(value.length > 50){
                    throw new Error("Title must not be longer than 50 chars!")
                }
                return value;
            },
            checkMoney: function (value){
                value = Number(value);
                if(isNaN(value))
                    throw new Error("Invalid number!");
                return value;
            }
        }
    }



    window.mafiaSystem.gangs =[
        {
            type:"gang",
            title:"Corleone",
            leader:{
                name:"Vito Corleone",
                sex:"male"
            },
            children:[
                {
                    type:"white-business",
                    title:"Tomorrow bar",
                    leader:{
                        name:"Adams Corleone",
                        sex:"male"
                    },
                    projects:[

                    ]
                },

                {
                    type:"white-business",
                    title:"Galaxy Fortune",
                    leader:{
                        name:"David Corleone",
                        sex:"male"
                    },
                    children:[
                        {
                            type:"white-business",
                            title:"Gamble Team"
                        }
                    ]
                },

                {
                    type:"black-business",
                    title:"Sisters in Shadow",
                    leader:{
                        name: "Diana Venom",
                        sex:"female"
                    },
                    children:[
                        {
                            name: "Lili Venom",
                            sex:"female"
                        },
                        {
                            name: "Roxanne Venom",
                            sex:"female"
                        }
                    ]
                }
            ]
        }
    ];
})((function () {
        return this;
    })());