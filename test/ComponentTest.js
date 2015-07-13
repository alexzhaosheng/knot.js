(function (global) {
    "use strict";

    var scope = global.Knot.getPrivateScope();

    var bodyNode = document.getElementsByTagName("body")[0];
    var headNode = document.getElementsByTagName("head")[0];

    var TestComponent = function(owner){
        this.owner = owner;
        this.data = {};
        this.callbacks = {};
    };
    var p =TestComponent.prototype;
    p.setValue = function(apDescription, value, options) {
        this.data[apDescription] = value;
    };
    p.getValue = function(apDescription, options) {
        return this.data[apDescription];
    };
    p.doesSupportMonitoring = function (apDescription) {
        return true;
    };
    p.monitor = function(apDescription, callback, options){
        if(!this.callbacks[apDescription]){
            this.callbacks[apDescription] = [];
        }
        this.callbacks[apDescription].push(callback);
    };
    p.stopMonitoring = function (apDescription, callback, options) {
        this.callbacks[apDescription].splice( this.callbacks[apDescription].indexOf(callback), 1);
    };
    p.dispose = function(){
        this.data = null;
    };
    p.notifyChanged = function(property){
        for(var i=0; i< this.callbacks[property].length; i++){
            this.callbacks[property][i]();
        }
    };

    global.QUnit.test( "private.Components", function ( assert ) {
        var testDiv =  global.KnotTestUtility.parseHTML('<div style="opacity: 0"></div>');
        bodyNode.appendChild(testDiv);
        var scriptBlock = global.KnotTestUtility.parseHTML('<script type="text/cbs">\r\n' +
            '#testCP{'+
                "tags:/testModel.tags"+
            '}'+
            '</script>');
        headNode.appendChild(scriptBlock);

        window.testModel = {tags:"knotjs,javascript"};

        var latestNode, latestComponentName;
        scope.HTMLKnotBuilder.registerComponent("TestComponent", function(node, componentName){
            latestNode = node;
            latestComponentName = componentName;
            return new TestComponent(node);
        });

        var cp = global.KnotTestUtility.parseHTML('<div id="testCP" knot-component="TestComponent"></div>');
        testDiv.appendChild(cp);

        scope.CBSLoader.loadGlobalScope();
        scope.HTMLKnotBuilder.bind();
        try{
            var cpObj = scope.HTMLKnotBuilder.getComponentObject(cp);

            assert.equal(latestNode, cp, "Component is initialized.");
            assert.equal(latestComponentName, "TestComponent", "Component is initialized.");
            assert.notEqual(cpObj, null, "Component is initialized.");
            assert.equal(cpObj.data.tags, "knotjs,javascript", "Component is initialized.");

            window.testModel.tags += ",xyz";
            assert.equal(cpObj.data.tags, "knotjs,javascript,xyz", "Component is updated by binding.");

            cpObj.data.tags =  "knotjs,xyz";
            cpObj.notifyChanged("tags");
            assert.equal(window.testModel.tags, "knotjs,xyz", "Component update binding correctly");

            scope.HTMLKnotBuilder.clear();
            assert.equal(cpObj.data, null, "dispose component");
        }
        finally {
            scope.HTMLKnotBuilder.clear();
            bodyNode.removeChild(testDiv);
            headNode.removeChild(scriptBlock);
        }
    });
})(window);