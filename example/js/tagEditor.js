/*
   tagEditor put the editor HTML and relevant CBS options in tagEditor.pkg.cbs, which is marked as private.
   The HTML in private CBS is referenced as a template
   TagEditor creates the UI and adds it to it's owner, then bind the UI to it self. It works like a "proxy"
   It receives the tags string, parse it into separated tags so that UI can present them correctly.
   And when UI changes the tags, TagEditor notify system and generate the new tags string
* */
(function (global) {
    "use strict";
    global.Knot.Advanced.registerComponent("TagEditor", function(node, component){
        return new TagEditor(node);
    });

    var TagEditor = function(owner){
        this.tagColor = "";
        this.tags = [];
        this.owner = owner;
        this.editorElement = global.Knot.Advanced.createFromTemplate("knot-example-tagEditor", this, owner);
        global.Knot.Advanced.setDataContext(this.editorElement, this, true);
        $(owner).append(this.editorElement);
        var that =this;
        this.editorElement.children[0].onTagEditorItemAdded = function (n) {
            $(n).css("backgroundColor", that.tagColor);
        };
    };

    var p =TagEditor.prototype;
    p.setValue = function(apDescription, value, options) {
        if(apDescription === "tags") {
            if(!value){
                this.tags = [];
            }
            else{
                this.tags = value.split(",").map(function (t) {return createTag(t);});
            }
        }
        else if(apDescription === "tagColor"){
            this.tagColor = value;
            $(this.editorElement).find(".knot-example-tagEditor-tags").css("backgroundColor", this.tagColor);
        }
    };
    p.getValue = function(apDescription, options) {
        return this.tags.map(function (t) {return t.name;}).join(",");
    };
    p.doesSupportMonitoring = function (apDescription) {
        return apDescription === "tags";
    };
    p.monitor = function(apDescription, callback, options){
        if(!this.callbacks){
            this.callbacks = [];
        }
        this.callbacks.push(callback);
    };
    p.stopMonitoring = function (apDescription, callback, options) {
        this.callbacks.splice( this.callbacks.indexOf(callback), 1);
    };

    p.raiseChangedEvent = function(){
        if(this.callbacks){
            for(var i=0; i<this.callbacks.length; i++){
                this.callbacks[i]();
            }
        }
    };
    p.dispose = function(){
        Knot.clear(this.editorElement);
        $(this.editorElement).remove();
    }


    p.deleteTag = function (tag) {
        if(this.tags.indexOf(tag) >= 0) {
            this.tags.splice(this.tags.indexOf(tag), 1);
            this.raiseChangedEvent();
        }
    };
    p.onAdd = function (arg, node) {
        var input  = $(node).closest(".knot-example-tagEditor").find("input");
        this.tags = this.tags.concat(input.val().split(",").map(function (t) {return createTag(t);}));
        input.val("");
        this.raiseChangedEvent();
    };




    //this function is to be attached to the tag object generated by TagEditorModel
    //so that it can be accessed by CBS knot options from current data context.
    //Another way to do it is put it into global scope and access it with absolute value path
    function onDeleteTag(eventArg, node) {
        var editor = $(node).closest(".knot-example-tagEditor");
        if(editor.length>0) {
            Knot.getDataContext(editor[0]).deleteTag(this);
        }
    }
    function createTag(name) {
        return {name:name, onDelete:onDeleteTag};
    }

})(window);