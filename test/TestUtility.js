(function(){
    window.KnotTestUtility = {
        parseHTML: function(html){
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.childNodes[0];
        }
    };
})();