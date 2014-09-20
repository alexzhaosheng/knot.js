(function(){
    var __private = Knot.getPrivateScope();

    __private.DataMonitor = {
        monitorData: function(data, pathOfData, knotInfo, onChanged){
            __private.DataEventMgr.register(data, knotInfo, function (propertyName) {
                var fullPath = propertyName;
                if (pathOfData != ""){
                    if(propertyName)
                        fullPath = pathOfData + "." + propertyName;
                    else
                        fullPath = pathOfData;
                }

                for (var p in knotInfo.options.twoWayBinding) {
                    var path = knotInfo.options.binding[p];
                    if(path[0] == "$" || path=="--self"){
                        onChanged(knotInfo, p);
                        continue;
                    }
                    //if the property is obtained from global scope, need to
                    //remove the first section to get the relative path
                    if(path[0] == "/"){
                        path = path.substr(path.indexOf(".")+1);
                    }

                    if(path.length < fullPath.length){
                        continue;
                    }
                    else if (fullPath == path.substr(0, fullPath.length)) {
                        __private.DataMonitor.setupDataNotification(knotInfo);
                        onChanged(knotInfo, p);
                    }
                }
            });
        },
        setupDataNotification: function(knotInfo, onChanged) {
            for (var valueName in knotInfo.options.twoWayBinding) {
                if(knotInfo.options.binding[valueName][0] == "$"){
                    __private.DataMonitor.monitorData(knotInfo.dataContext, "", knotInfo, onChanged);
                }

                if (knotInfo.options.bindingToError && knotInfo.options.bindingToError[valueName]) {
                    if( __private.DataMonitor.setupErrorNotification(knotInfo, valueName, onChanged))
                        continue;
                }

                var pathSections = knotInfo.options.binding[valueName].split(".");
                var path = "";
                for (var i = 0; i < pathSections.length + 1; i++) {
                    var curData = knotInfo.dataContext;
                    if (path != ""){
                        curData =__private.Utility.getValueOnPath(knotInfo.dataContext, path)
                    }
                    if (!curData)
                        break;

                    if(typeof(curData) != "object" && typeof(curData) != "array")
                        break;

                    if (!__private.DataEventMgr.hasRegistered(curData, knotInfo)) {
                        __private.DataMonitor.monitorData(curData, path, knotInfo, onChanged);
                    }

                    if(path != "")
                        path += ".";
                    path += pathSections[i];
                }
            }
        },
        setupErrorNotification: function(knotInfo, valueName, onChanged){
            var fullPath = knotInfo.options.binding[valueName];
            var arr = fullPath.split(".");
            var propertyName = arr[arr.length - 1];
            var objectPath = fullPath.substr(0, fullPath.length - propertyName.length-1);
            var dataToBinding = __private.Utility.getValueOnPath(knotInfo.dataContext, objectPath);
            if (dataToBinding) {
                if (!__private.Validating.hasRegisteredOnError(dataToBinding)) {
                    (function () {
                        __private.Validating.registerOnError(dataToBinding, knotInfo, function (property) {
                            for (var v in knotInfo.options.bindingToError) {
                                if (knotInfo.options.binding[v].substr(0, objectPath.length) == objectPath) {
                                    var pos = objectPath.length>0?objectPath.length+1:0;
                                    if (property == knotInfo.options.binding[v].substr(pos))
                                        onChanged(knotInfo, v);
                                }
                            }
                        });
                        __private.knotDebugger.debug(knotInfo,valueName, "setup");
                    })();
                }
                return true;
            }
            return false;
        }
    };
})();