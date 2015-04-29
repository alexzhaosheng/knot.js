///////////////////////////////////////////////////////
// Replace the property of the object to detect the change
// of the properties
///////////////////////////////////////////////////////
(function(){
    var __private = Knot.getPrivateScope();

    __private.PropertyHooker = {
        hookProperty:function(object, property){
            if(!object.__knot_dataHook){
                Object.defineProperty(object, "__knot_dataHook", {value:{hookedProperties:[], data:{}}, writable:false, enumerable:false});
            }
            if(object.__knot_dataHook.hookedProperties.indexOf(property) >= 0)
                return;

            //save current value
            object.__knot_dataHook.hookedProperties.push(property);
            object.__knot_dataHook.data[property] = object[property];

            //define a new property to overwrite the current one
            Object.defineProperty(object, property, {
                set:function(v){
                    this.__knot_dataHook.data[property] = v;
                    __private.DataMonitor.notifyDataChanged(this, property);
                },
                get:function(){
                    return this.__knot_dataHook.data[property];
                }
            })
        },

        unhookObject: function(object){
            if(!object.__knot_dataHook){
                return;
            }

            for(var i=0; i<object.__knot_dataHook.hookedProperties.length; i++){
                var property = object.__knot_dataHook.hookedProperties[i];
                delete  object[property];
                object[property] = object.__knot_dataHook.data[property];
            }
            delete  object.__knot_dataHook;
        }
    };
})();