/*!
 * knot.js extensions
 * 
 * Copyright 2013 Sheng(Alex) Zhao 
 * Released under the MIT license 
 * 
 */

(function (knot) {
    knot.Converters = {
        createBoolToValue:function(valueWhenTrue, valueWhenFalse){
            return {
                to: function (value) {
                    if (value)
                        return valueWhenTrue;
                    else
                        return valueWhenFalse;
                },
                from: function (value) {
                    if (value == valueWhenTrue)
                        return true;
                    else
                        return false;
                }
            };
        },
        createKeysToValues: function (keys, values) {
            return {
                to: function (v) {
                    return values[keys.indexOf(v)];
                },
                from: function (v) {
                    return keys[values.indexOf(v)];
                }
            }
        }        
    }




    Knot.Validators = {
        createNotNull: function (errorMessage) {
            return function (value) {
                if (value == "" || !value)
                    return errorMessage;
                return null;
            };
        },
        createInteger: function (errorMessage) {
            return function (value) {
                if (!value || value == "")
                    return null;
                if (!/^\+?(0|[1-9]\d*)$/.test(value))
                    return errorMessage;
                return null;
            }
        },
        createGreaterOrEqalThan: function (valueToCompare, errorMessage) {
            return function (value) {
                if (!value || value == "")
                    return null;
                var v = Number(value);
                if (v < valueToCompare) {
                    return errorMessage;
                }
                return null;
            };
        },
        createLessOrEqalThan: function (valueToCompare, errorMessage) {
            return function (value) {
                if (!value || value == "")
                    return null;
                var v = Number(value);
                if (v > valueToCompare) {
                    return errorMessage;
                }
                return null;
            };
        },
        createValueRange: function (min, max, errorMessage) {
            return function (value) {
                if (!value || value == "")
                    return null;
                var v = Number(value);
                if (v < min || v>max) {
                    return errorMessage;
                }
                return null;
            };
        }
    }
})(Knot);
