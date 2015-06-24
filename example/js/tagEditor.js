(function (global) {
    "use strict";
    var APProvider = {
        doesSupport: function (target, apName) {
            return (target instanceof  HTMLElement) && target.tagName.toLowerCase() === "div" &&
                    apName === "knot-example-tagEditor";
        },
        getValue: function (target, apName, options) {
            if(!target.tagEditorModel) {
                return null;
            }
            else {
                return target.tagEditorModel.getValue();
            }
        },

        setValue: function (target, apName, value, options) {
            if(!target.tagEditorModel) {
                target.tagEditorModel = new TagEditorModel();
                var ele = global.Knot.Advanced.createFromTemplate("knot-example-tagEditor", target.tagEditorModel, target);
                global.Knot.Advanced.setDataContext(ele, target.tagEditorModel);
                $(target).append(ele);
                ele.children[0].onTagEditorItemAdded = function (n) {
                    if(options && options.color) {
                        $(n).css("backgroundColor", options.color);
                    }
                };
            }
            target.tagEditorModel.setValue(value);
        },
        doesSupportMonitoring: function (target, apName) {
            return true;
        },
        monitor: function (target, apName, callback, options) {
            if(!target.tagEditorModel) {
                target.tagEditorModel = new TagEditorModel();
            }
            target.tagEditorModel.monitor(callback);
        },
        stopMonitoring: function (target, apName, callback, options) {
            if(!target.tagEditorModel) {
                return;
            }
            target.tagEditorModel.stopMonitoring(callback);
        }
    };

    global.Knot.Advanced.registerAPProvider(APProvider);

    function onDeleteTag(eventArg, node) {
        var editor = $(node).closest(".knot-example-tagEditor");
        if(editor.length>0) {
            global.Knot.getDataContext(editor[0]).deleteTag(this);
        }
    }
    function createTag(name) {
        return {name:name, onDelete:onDeleteTag};
    }

    var TagEditorModel = function () {
        this.tags = [];
        this._editor = null;
        this._changedCallbacks = [];
    };
    TagEditorModel.prototype.setValue = function (value) {
        if(!value) {
            this.tags = [];
        }
        this.tags = value.split(",").map(function (t) {return createTag(t);});
    };
    TagEditorModel.prototype.getValue = function () {
        return this.tags.map(function (t) {return t.name;}).join(",");
    };

    TagEditorModel.prototype.raiseChangedEvent = function () {
        for(var i=0; i< this._changedCallbacks.length; i++) {
            this._changedCallbacks[i]();
        }
    };

    TagEditorModel.prototype.monitor = function (callback) {
        this._changedCallbacks.push(callback);
    };
    TagEditorModel.prototype.stopMonitoring = function (value) {
        this._changedCallbacks.splice(this._changedCallbacks.indexOf(value), 1);
    };

    TagEditorModel.prototype.deleteTag = function (tag) {
        if(this.tags.indexOf(tag) >= 0) {
            this.tags.splice(this.tags.indexOf(tag), 1);
            this.raiseChangedEvent();
        }
    };
    TagEditorModel.prototype.onAdd = function (arg, node) {
        var input  = $(node).closest(".knot-example-tagEditor").find("input");
        this.tags = this.tags.concat(input.val().split(",").map(function (t) {return createTag(t);}));
        input.val("");
        this.raiseChangedEvent();
    };


})(window);