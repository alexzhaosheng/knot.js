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
        createKeysToValues: function (keyValues) {
            return {
                to: function (v) {
                    v = (v==null? v: v.toString());
                    return keyValues[v];
                },
                from: function (v) {
                    v = (v==null? v: v.toString());
                    for(var p in keyValues)
                        if(keyValues[p] == v)
                            return p;
                }
            }
        }
    }



    Knot.Validators = {
        createNotNull: function (errorMessage) {
            if(!errorMessage)
                throw new Error("Error message must not be null!");
            return function (value) {
                if (value == "" || !value)
                    return errorMessage;
                return null;
            };
        },
        createInteger: function (errorMessage) {
            if(!errorMessage)
                throw new Error("Error message must not be null!");
            return function (value) {
                if (!value || value == "")
                    return null;
                if (!/^\+?(0|[1-9]\d*)$/.test(value))
                    return errorMessage;
                return null;
            }
        },
        createGreaterOrEqalThan: function (valueToCompare, errorMessage) {
            if(!errorMessage)
                throw new Error("Error message must not be null!");
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
            if(!errorMessage)
                throw new Error("Error message must not be null!");
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
            if(!errorMessage)
                throw new Error("Error message must not be null!");
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

    Knot.Collection = {
        createSelectionHelper: function(model, nameOfSelectedOnModel, collection, nameOfIsSelectedOnItem){
            return function(){
                Knot.setValue(this, nameOfIsSelectedOnItem, true);
                Knot.setValue(model, nameOfSelectedOnModel, this);
                for(var i=0; i<collection.length; i++){
                    if(collection[i] != this)
                        Knot.setValue(collection[i], nameOfIsSelectedOnItem, false);
                }
            };
        }
    }
})(Knot);
