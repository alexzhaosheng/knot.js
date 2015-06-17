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
        if($(tagSelector).length > 0){
            var data  ={name:typeName, content: $(tagSelector)[0].innerText};
            window.sourceInformation.push(data);
            if($(tagSelector)[0].src){
                var hr = getXHRS();
                hr.onreadystatechange = function(){
                    if(hr.readyState == 4){
                        if(hr.status == 200){
                            data.content  = hr.responseText;
                        }
                    }
                }
                hr.open("GET", $(tagSelector)[0].src, true);
                hr.send();
            }
        }
    }

    if( $("#exampleJS").length > 0)
        loadScript("#exampleJS", "Javascript");

    if( $("#exampleCBS").length > 0)
        loadScript("#exampleCBS", "CBS");

    if( $("#exampleCSS").length > 0)
        loadScript("#exampleCSS", "CSS");
});

document.writeln('<div id="sourceTab">'+
    '<div id="codePageTemplate" knot-template>'+
    '<pre><code></code></pre>'+
'</div>'+
'</div>');