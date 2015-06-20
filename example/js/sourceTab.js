window.sourceInformation= [];
$(document).ready(function(){
    if($(".knot_example").length > 0){
        var text = "";
        for(var i=0; i<$("body>.knot_example").length; i++){
            if(text)
                text += "\r\n\r\n\r\n\r\n";
            text += $(".knot_example").eq(i)[0].outerHTML;
        }
        window.sourceInformation.push({name:"HTML", content: text});
    }

    function getXHRS(){
        if (window.XMLHttpRequest){
            return new XMLHttpRequest();
        }
        else{
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    }

    function loadScript(tagSelector, typeName){
        for(var i=0; i<$(tagSelector).length; i++){
            (function(){
                var script = $(tagSelector).eq(i)[0];
                var data  ={name:typeName, content: script.innerText};
                if(script.getAttribute("title"))
                    data.name = script.getAttribute("title");
                window.sourceInformation.push(data);
                if(script.src || script.href){
                    var hr = getXHRS();
                    hr.onreadystatechange = function(){
                        if(hr.readyState == 4){
                            if(hr.status == 200){
                                data.content  = hr.responseText;
                            }
                        }
                    }
                    hr.open("GET", script.src || script.href, true);
                    hr.send();
                }
            })();
        }
    }

    loadScript(".exampleJS", "Javascript");
    loadScript(".exampleCBS", "CBS");
    loadScript(".exampleCSS", "CSS");
});

document.writeln('<div id="sourceTab">'+
    '<div id="codePageTemplate" knot-template-id="codePageTemplate">'+
    '<pre><code></code></pre>'+
'</div>'+
'</div>');