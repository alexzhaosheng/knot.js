(function(window){

    var APProvider = {
        doesSupport:function(target, apName){
            return (target instanceof  HTMLElement) && target.tagName.toLowerCase() == "div" &&
                    apName == "knot-example-tagEditor";
        },
        getValue: function(target, apName, options){
            if(!target.tagEditorData)
                return null;
            else
                return target.tagEditorData.getValue();
        },

        setValue: function(target, apName, value, options){
            if(!target.tagEditorData){
                target.tagEditorData = new TagEditorData();
                var ele = window.Knot.Advanced.createFromTemplate("knot-example-tagEditor", target.tagEditorData);
                $(target).append(ele);
                target.tagEditorData.setEditor(ele);
            }
            target.tagEditorData.setValue(value);
        },
        doesSupportMonitoring: function(target, apName){
            return true;
        },
        monitor: function(target, apName, callback, options){
            if(!target.tagEditorData){
                target.tagEditorData = new TagEditorData();
            }
            target.tagEditorData.monitor(callback);
        },
        stopMonitoring: function(target, apName, callback, options){
            if(!target.tagEditorData)
                return;
            target.tagEditorData.stopMonitoring(callback);
        }
    }

    window.Knot.Advanced.registerAPProvider(APProvider);

    var TagEditorData = function(){
        this.tags = [];
        this._editor = null;
        this._changedCallbacks = [];
    };
    TagEditorData.prototype.setValue = function(value){
        if(!value)
            this.tags = [];
        this.tags = value.split(",");
    }
    TagEditorData.prototype.getValue = function(){
        return this.tags.join(",");
    }
    TagEditorData.prototype.setEditor = function(editor){
        this._eidtor = editor;
        var that =this;
        $(this._eidtor).find(".knot-example-tagEditor-add").click(function(){
            that.tags = that.tags.concat($(editor).find("input").val().split(","));
            $(editor).find("input").val("");
            that.raiseChangedEvent();
        });
        $(this._eidtor).find(".knot-example-tagEditor-add").click(function(){
            that.tags = that.tags.concat($(editor).find("input").val().split(","));
            $(editor).find("input").val("");
            that.raiseChangedEvent();
        });
    }
    TagEditorData.prototype.raiseChangedEvent = function(){
        for(var i=0; i< this._changedCallbacks.length; i++)
            this._changedCallbacks[i]();
    }

    TagEditorData.prototype.monitor = function(callback){
        this._changedCallbacks.push(callback);
    }
    TagEditorData.prototype.stopMonitoring = function(value){
        this._changedCallbacks.splice(this._changedCallbacks.indexOf(value), 1);
    }
})((function() {
        return this;
    })());