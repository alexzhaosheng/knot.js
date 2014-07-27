(function(){
    var scope = Knot.getPrivateScope();

    var TestKnot = function(node, value){
        this.node = node;
        this.value = value;
    }
    TestKnot.prototype.isSupported =  function(node, value){
        return node == this.node && value==this.value;
    }

    QUnit.test( "private.Extension", function( assert ) {
        var node1 ={}, node2={};
        var t1 = new TestKnot(node1, "value1"), t2 = new TestKnot(node1, "value2");
        scope.Extension.register(t1, "knot_type");
        scope.Extension.register(t2, "knot_type");
        scope.Extension.register(t1, "knot_action");

        assert.equal(scope.Extension.findProperKnotType(node1, "value1"), t1);
        assert.equal(scope.Extension.findProperKnotType(node1, "value2"), t2);
        assert.equal(scope.Extension.findProperActionType(node1, "value1"), t1);
        assert.equal(scope.Extension.findProperActionType(node1, "value2"), null);

    });
})();