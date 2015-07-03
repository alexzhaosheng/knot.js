
window.bookStoreModel = {
    categories:null,
    selectedCategory: null,
    selectedBook: null,

    contentTemplateSelector: function(values){
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
    },

    getCategory: function(values){
        var id = values[0];
        var categories = values[1];
        if(categories) {
            for(var i=0; i<categories.length; i++){
                if(categories[i].id === id)
                    return categories[i];
            }
            return categories[0];
        }
        else{
            return null;
        }
    },

    getBook:function(values){
        var id = values[0];
        var categories = values[1];
        if(categories && categories.length>0) {
            var allBooks = categories[categories.length-1].items;
            for(var i=0; i<allBooks.length; i++){
                if(allBooks[i].id === Number(id))
                    return allBooks[i];
            }
            return null;
        }
        else{
            return null;
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
        },
        function(err){
            alert(err);
        }
    );
});

Knot.setHashFormat(["category", "book"], "/");