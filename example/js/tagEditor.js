(function (window){

    var APProvider = {
        doesSupport: function (target, apName){
            return (target instanceof  HTMLElement) && target.tagName.toLowerCase() == "div" &&
                    apName == "knot-example-tagEditor";
        },
        getValue: function (target, apName, options){
            if(!target.tagEditorData)
                return null;
            else
                return target.tagEditorData.getValue();
        },

        setValue: function (target, apName, value, options){
            if(!target.tagEditorData){
                target.tagEditorData = new TagEditorData();
                var ele = window.Knot.Advanced.createFromTemplate("knot-example-tagEditor", target.tagEditorData, target);
                $(target).append(ele);
                ele.children[0].onTagEditorItemAdded = function (n){
                    if(options && options["color"]){
                        $(n).css("backgroundColor", options["color"]);
                    }
                };
            }
            target.tagEditorData.setValue(value);
        },
        doesSupportMonitoring: function (target, apName){
            return true;
        },
        monitor: function (target, apName, callback, options){
            if(!target.tagEditorData){
                target.tagEditorData = new TagEditorData();
            }
            target.tagEditorData.monitor(callback);
        },
        stopMonitoring: function (target, apName, callback, options){
            if(!target.tagEditorData)
                return;
            target.tagEditorData.stopMonitoring(callback);
        }
    }

    window.Knot.Advanced.registerAPProvider(APProvider);

    function onDeleteTag(eventArg, node){
        var editor = $(node).closest(".knot-example-tagEditor");
        if(editor.length>0){
            window.Knot.getDataContext(editor[0]).deleteTag(this);
        }
    }
    function createTag(name){
        return {name:name, onDelete:onDeleteTag};
    }

    var TagEditorData = function (){
        this.tags = [];
        this._editor = null;
        this._changedCallbacks = [];
    };
    TagEditorData.prototype.setValue = function (value){
        if(!value)
            this.tags = [];
        this.tags = value.split(",").map(function (t){return createTag(t);});
    }
    TagEditorData.prototype.getValue = function (){
        return this.tags.map(function (t){return t.name;}).join(",");
    }

    TagEditorData.prototype.raiseChangedEvent = function (){
        for(var i=0; i< this._changedCallbacks.length; i++)
            this._changedCallbacks[i]();
    }

    TagEditorData.prototype.monitor = function (callback){
        this._changedCallbacks.push(callback);
    }
    TagEditorData.prototype.stopMonitoring = function (value){
        this._changedCallbacks.splice(this._changedCallbacks.indexOf(value), 1);
    }

    TagEditorData.prototype.deleteTag = function (tag){
        if(this.tags.indexOf(tag) >= 0){
            this.tags.splice(this.tags.indexOf(tag), 1);
            this.raiseChangedEvent();
        }
    }
    TagEditorData.prototype.onAdd = function (arg, node){
        var input  = $(node).closest(".knot-example-tagEditor").find("input");
        this.tags = this.tags.concat(input.val().split(",").map(function (t){return createTag(t);}));
        input.val("");
        this.raiseChangedEvent();
    }


})((function () {
        return this;
    })());