(function(){

    var __private = Knot.getPrivateScope();

    ///////////////////////////////////////////////////////
    // Knot extensions
    ///////////////////////////////////////////////////////
    __private.Extension = {
        _knotTypes:[],
        _actions: [],

        register: function(ext, type) {
            //always insert the extensions to the first. So that the extensions that registered lately
            //would overwrite the previous ones.
            if(type == "knot_type")
                this._knotTypes.splice(0, 0, ext);
            else if(type == "knot_action")
                this._actions.splice(0, 0, ext);
            else
                throw new Error("Unknown type:" + type);
        },
        findProperKnotType: function(node, valueName) {
            for (var i = 0; i < this._knotTypes.length; i++) {
                if (this._knotTypes[i].isSupported(node, valueName)) {
                    return this._knotTypes[i];
                }
            }
            throw new Error("Failed to find knot type! Element tag name: " + node.tagName + " binding type: " + valueName);
        },

        findProperActionType: function(node, actionName) {
            for (var i = 0; i < this._actions.length; i++) {
                if (this._actions[i].isSupported(node, actionName)) {
                    return this._actions[i];
                }
            }
            return null;
        }
    }
})();
