window.sourceTab = {
    sourceInformation: [],

    onPageAdded: function (node) {
        hljs.highlightBlock($(node).find("code")[0]);
    }
};
$(document).ready(function () {
    if($(".knot_example").length > 0) {
        var text = "";
        for(var i=0; i<$("body .knot_example").length; i++) {
            if(text) {
                text += "\r\n\r\n\r\n\r\n";
            }
            text += $(".knot_example").eq(i)[0].outerHTML;
        }
        window.sourceTab.sourceInformation.push({name:"HTML", content: text, title:"HTML"});
    }

    function getXHRS() {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
        else{
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
    }

    function loadScript(tagSelector, typeName) {
        for(var i=0; i<$(tagSelector).length; i++) {
            (function () {
                var script = $(tagSelector).eq(i)[0];
                var data  ={name:typeName, content: script.innerText, title:typeName};
                if(script.getAttribute("title")) {
                    data.title = script.getAttribute("title");
                }
                window.sourceTab.sourceInformation.push(data);
                if(script.src || script.href) {
                    var hr = getXHRS();
                    hr.onreadystatechange = function () {
                        if(hr.readyState === 4) {
                            if(hr.status === 200) {
                                data.content  = hr.responseText;
                            }
                        }
                    };
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

document.writeln('<div id="sourceTab" knot-debugger-ignore>'+
    '<div id="codePageTemplate" knot-template-id="codePageTemplate">'+
        '<pre><code></code></pre>'+
    '</div>'+
    '</div>');