
window.bookStoreModel = {
    categories:null,
    selected: null,

    getSelected: function(values){
        var cateHash = values[0];
        var bookHash = values[1];
        var categories = values[2];
        if(!categories){
            return null;
        }
        else {
            var selected = {};
            for(var i=0; i<categories.length; i++){
                if(categories[i].id === cateHash){
                    selected.category = categories[i];
                    break;
                }
            }
            if(selected.category){
                for(i=0; i<selected.category.items.length; i++){
                    if(selected.category.items[i].id === Number(bookHash)) {
                        selected.book = selected.category.items[i];
                        break;
                    }
                }
            }
            return selected;
        }
    },

    contentTemplateSelector: function(values){
        if(values["book"]) {
            return "bookDetailsTemplate";
        }
        else if(values["category"]){
            return "bookListTemplate";
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