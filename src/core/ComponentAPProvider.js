(function (global) {
    "use strict";
    var __private = global.Knot.getPrivateScope();

    var provider = {
        doesSupport: function (target, apName) {
            return target && target.__knot_component;
        },
        getValue: function (target, apName, options) {
            return target.__knot_component.getValue(apName, options);
        },

        setValue: function (target, apName, value, options) {
            target.__knot_component.setValue(apName, value, options);
        },
        doesSupportMonitoring: function (target, apName) {
            return target.__knot_component.doesSupportMonitoring(apName);
        },
        monitor: function (target, apName, callback, options) {
            target.__knot_component.monitor(apName, callback, options);
        },
        stopMonitoring: function (target, apName, callback, options) {
            target.__knot_component.stopMonitoring(apName, callback, options);
        }
    };

    __private.KnotManager.registerAPProvider(provider, false, true);
})(window);