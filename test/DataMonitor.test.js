(function(){
    var scope = Knot.getPrivateScope();

    QUnit.test("private.DataMonitor", function( assert ) {
        var node = KnotTestUtility.parseHTML('<input binding="'+
            'style:{left:*left=>cvt.toLeftNumber; top:top; border-color:!value=>cvt.toBorderColor};'+
            'value:*subitem.title=>cvt.trimString&cvt.urlEncoding =!validator.notNull & validator.titleLengthCheck;' +
            '@click:onTitleClicked"></input>');
        var options = scope.OptionParser.parse(node);
        var obj = {name:"test", group:"ga"};
        var info = {options:options};
        var changedSrc, changedProperty;
        scope.DataMonitor.monitorData(obj, "", info, function(info, p){
            changedSrc = info;
            changedProperty = p;
        });

        obj.left= "10";
        scope.DataEventMgr.notifyDataChanged(obj, "left");
        assert.equal(changedProperty, "style-left");
        assert.equal(changedSrc, info);

        obj.subitem = {};
        scope.DataEventMgr.notifyDataChanged(obj, "subitem");
        obj.subitem.title = "item title";
        scope.DataEventMgr.notifyDataChanged(obj.subitem, "title");
        assert.equal(changedProperty, "value");
        assert.equal(changedSrc, info);

        info.dataContext = obj;
        scope.DataMonitor.setupDataNotification(info, function(info, p){
            changedSrc = info;
            changedProperty = p;
        });

        changedProperty="";
        changedSrc = null;
        scope.Validating.setError(obj, "value", "Validate error test");
        assert.equal(changedProperty, "style-border-color");
        assert.equal(changedSrc, info);
    });
})();