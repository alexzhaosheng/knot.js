(function(window){
    window.mafiaSystem = {
        gangs:null,

        nodeContentTemplateSelector:function(data){
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
                            title:"Gamble Team",
                            manInCharge:{
                            }
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
})((function() {
        return this;
    })());