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

window.mafiaSystem.freeEntities.push({
    type:"white-business",
    title:"Galaxy Restaurant",
    leader:null,
    children:[]
});