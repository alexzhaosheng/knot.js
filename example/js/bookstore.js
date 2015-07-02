window.bookStoreModel = {
    categories:null,
    selectedCategory: null,
    selectedBook: null,

    contentTemplateSelector:function(values){
        if(values[1]){
            var template = Knot.Advanced.createFromTemplate("bookDetailsTemplate", values[1], values[1]);
            Knot.Advanced.setDataContext(template, values[1]);
            return template;
        }
        else{
            if(values[0]){
                var template = Knot.Advanced.createFromTemplate("bookListTemplate", values[0], values[0]);
                Knot.Advanced.setDataContext(template, values[0]);
                return template;
            }
        }
    }
};

Knot.ready(function(){
    $.ajax({
        type:"GET",
        url:"rsc/bookstore.json"
    }).then(function(ret){
            var categories = ret;
            if(categories[categories.length-1].id==="all"){
                var all =[];
                for(var i=0; i<categories.length-1; i++){
                    all = all.concat(categories[i].items);
                }
                categories[categories.length-1].items = all;
            }
            window.bookStoreModel.categories = categories;
            if(categories.length > 0 && !window.bookStoreModel.selectedCategory){
                window.bookStoreModel.selectedCategory = categories[0];
            }
        },
        function(err){
            alert(err);
        }
    );
});