/*
    AttachedData is an object attached to the data. It's used to store the necessary information that
    keeps knots working.
    If "Setting.enablePropertyHook" is enabled, attached data is directly stored on object as a non-enumerable
    property named "__knot_attachedData", other with it's stored in an dictionary structure which takes the object as the
    key
 */
(function(window){
    var __private = window.Knot.getPrivateScope();
    __private.AttachedData = {
        _dataInMonitoring: [],
        _attachedInfoOfData: [],

        getAttachedInfo: function(data) {
            if(__private.Setting.enablePropertyHook){
                if(!data.__knot_attachedData){
                    if(typeof(data) != "object" && typeof(data) != "array"){
                        throw new Error("Can only monitor object or array!");
                    }
                    Object.defineProperty(data, "__knot_attachedData", {value:{}, configurable:true, writable:false, enumerable:false});
                }
                return data.__knot_attachedData;
            }
            else{
                if (this._dataInMonitoring.indexOf(data) < 0) {
                    this._dataInMonitoring.push(data);
                    this._attachedInfoOfData[this._dataInMonitoring.indexOf(data)] = {};
                }
                return this._attachedInfoOfData[this._dataInMonitoring.indexOf(data)];
            }
        },
        releaseAttachedInfo: function(data) {
            if(__private.Setting.enablePropertyHook){
                delete data.__knot_attachedData;
            }
            else{
                var index = this._dataInMonitoring.indexOf(data);
                if (index >= 0) {
                    delete this._dataInMonitoring[index];
                    delete this._attachedInfoOfData[index];
                }
            }
        }
    };
})((function() {
        return this;
    })());