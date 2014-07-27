(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test( "private.CBS", function( assert ) {
        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs">' +
            '#cbsTest{value:*test}'+
            '.cbsTestClass span [1]{text:title} '+
            '.cbsTestClass span [2]{text:description} '+
            '</script>');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);

        var testNode = KnotTestUtility.parseHTML('<div>' +
            '<input style="display: none" id="cbsTest"/>' +
            '<div class="cbsTestClass"/>' +
                '<span></span>' +
                '<span></span>' +
                '<span></span>' +
            '</div>' +
            '</div>');
        document.getElementsByTagName("body")[0].appendChild(testNode);

        scope.CBS.cbsInit();
        assert.equal(testNode.children[0].__knot_cbs_options != null, true);
        assert.equal(testNode.children[0].__knot_cbs_options, "value:*test");

        assert.equal(testNode.children[1].children[0].__knot_cbs_options == null, true);

        assert.equal(testNode.children[1].children[1].__knot_cbs_options != null, true);
        assert.equal(testNode.children[1].children[1].__knot_cbs_options, "text:title");

        assert.equal(testNode.children[1].children[2].__knot_cbs_options != null, true);
        assert.equal(testNode.children[1].children[2].__knot_cbs_options, "text:description");


        document.getElementsByTagName("body")[0].removeChild(testNode);
        document.getElementsByTagName("head")[0].removeChild(scriptBlock);
    });

    QUnit.asyncTest("private.CBS.Loading Stand along CBS File", function(assert){
        expect(2);

        var scriptBlock = KnotTestUtility.parseHTML('<script type="text/cbs" src="./CBS.test.cbs">');
        document.getElementsByTagName("head")[0].appendChild(scriptBlock);

        var testNode = KnotTestUtility.parseHTML('<div><input style="display: none" id="cbsFileTest"/></div>');
        document.getElementsByTagName("body")[0].appendChild(testNode);
        scope.CBS.cbsInit(function(){
            assert.equal(testNode.children[0].__knot_cbs_options != null, true);
            assert.equal(testNode.children[0].__knot_cbs_options, "value:*test");

            document.getElementsByTagName("body")[0].removeChild(testNode);
            document.getElementsByTagName("head")[0].removeChild(scriptBlock);
            QUnit.start();
        });
    })
})();