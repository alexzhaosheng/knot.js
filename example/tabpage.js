(function(window){
    var pageAPProvider = {
        doesSupport:function(target, apName){
            if(target && target.tagName &&  target.tagName.toLowerCase() == "div" && apName=="knotdbg-tab")
                return true;
            return false;
        },
        getValue: function(target, apName, options){

        },

        setValue: function(target, apName, value, options){
            var template = function(data){
                var p = $('<div class="page"></div>');
                if(options && options["template"])
                    p.append($(Knot.Advanced.createFromTemplate(options["template"], data)));
                else
                    p.text(data);
                return p[0];
            };
            var headerTemplate = function(data){
                var p = $('<div class="header"></div>');
                if(options && options["header-template"])
                    p.append($(Knot.Advanced.createFromTemplate(options["header-template"], data)));
                else if(options && options["header-title"])
                    p.text(window.Knot.Advanced.getValueOnPath(data, options["header-title"]));
                else
                    p.text(data);
                return p[0];
            };

            var page = $(target).find(".knotdbg-tab");
            if(page.length == 0){
                page = $('<div class="knotdbg-tab">' +
                        '<div class="page-headerArea"/>' +
                        '<div class="page-contentArea"></div>' +
                    '</div>')
                    .appendTo($(target));
            }

            Knot.Advanced.synchronizeItems(page.find(".page-headerArea")[0], value, headerTemplate, function(n){
                $(n).click(function(){
                    selectPage(page, Array.prototype.indexOf.apply(page.find(".page-headerArea")[0].childNodes, [n]));
                });
            });
            Knot.Advanced.synchronizeItems(page.find(".page-contentArea")[0], value, template, function(n){
                if(options && options["@pageAdded"]){
                    var added = window.Knot.Advanced.getValueOnPath(window, options["@pageAdded"]);
                    if(added)
                        added.apply(n, [n]);
                }
            });

            var currIndex = getCurrentPageIndex(page);
            if(currIndex<0)
                selectPage(page, 0);
        },
        doesSupportMonitoring: function(target, apName){
            return false;
        }
    }

    function selectPage(page, index){
        page.find(".page-headerArea>*").removeClass("selected").eq(index).addClass("selected");
        page.find(".page-contentArea>*").removeClass("selected").eq(index).addClass("selected");
    }
    function getCurrentPageIndex(page){
        var p = page.find(".page-headerArea>.selected");
        if(p.length ==0)
            return -1;
        return  Array.prototype.indexOf.apply(r.find(".page-headerArea")[0].childNodes, [p[0]]);
    }

    window.Knot.Advanced.registerAPProvider(pageAPProvider);
})((function() {
        return this;
    })());