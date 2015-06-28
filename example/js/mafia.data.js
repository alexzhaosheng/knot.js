window.mafiaSystem.gangs =[
    {
        type:"gang",
        title:"Corleone",
        isInSystem:true,
        leader:{
            name:"Vito Corleone",
            sex:"male",
            isInSystem:true
        },
        children:[
            {
                type:"white-business",
                title:"Tomorrow bar",
                isInSystem: true,
                leader:{
                    name:"Adams Corleone",
                    sex:"male",
                    isInSystem:true
                }
            },

            {
                type:"white-business",
                title:"Galaxy Fortune",
                isInSystem:true,
                leader:{
                    name:"David Corleone",
                    sex:"male",
                    isInSystem:true
                },
                children:[
                    {
                        type:"white-business",
                        title:"Gamble Team",
                        isInSystem:true
                    }
                ]
            },

            {
                type:"black-business",
                title:"Sisters in Shadow",
                isInSystem:true,
                leader:{
                    name: "Diana Venom",
                    sex:"female",
                    isInSystem:true
                },
                children:[
                    {
                        name: "Lili Venom",
                        sex:"female",
                        isInSystem:true
                    },
                    {
                        name: "Roxanne Venom",
                        sex:"female",
                        isInSystem:true
                    }
                ]
            }
        ]
    }
];

window.mafiaSystem.ratingLevelOptions = ["Bad", "Moderate", "Good"];

window.mafiaSystem.freeEntities.push({
    type:"white-business",
    title:"Galaxy Restaurant",
    leader:null,
    children:[]
});

updateGangsInfo();