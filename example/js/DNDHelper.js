(function(global){
    "use strict";
    var _currentDragListener;
    var _currentMousePointDown;
    var _isInDrag = false;

    $(document).ready(function(){
        $(window).mousedown(function(evt){
            var src = evt.target.closest(".dragSource");
            if(src && src.dragSourceListener){
                _currentDragListener = src.dragSourceListener;
                _currentMousePointDown = {x:evt.pageX, y:evt.pageY};
            }
        });

        $(window).mouseup(function(evt){
            if(_isInDrag){
                var pos =  {x:evt.pageX, y:evt.pageY};
                var target =  $(document.elementFromPoint(pos.x, pos.y)).closest(".dropTarget");
                if(target.length > 0 && target[0].dropListener && target[0].dropListener.test(_currentDragListener.getData())){
                    target[0].dropListener.drop(_currentDragListener.getData());
                    _currentDragListener.notifyDropIsDone();
                }
                else{
                    _currentDragListener.notifyDropIsCancelled();
                }
            }
            _isInDrag = false;
            _currentDragListener = null;
            _currentMousePointDown = null;
            document.body.style.cursor = "auto";
        });

        $(window).mousemove(function(evt){
            if(!_currentDragListener) {
                return;
            }
             var pos =  {x:evt.pageX, y:evt.pageY};
            if(!_isInDrag){
                var offset = Math.sqrt(Math.pow(pos.y-_currentMousePointDown.x, 2) + Math.pow(pos.y-_currentMousePointDown.y, 2));
                if(offset > 10){
                    _isInDrag = true;
                    _currentDragListener.dragStart(pos);
                    document.body.style.cursor = "not-allowed";
                }
            }
            else{
                _currentDragListener.dragMove(pos);
                var target =  $(document.elementFromPoint(pos.x, pos.y)).closest(".dropTarget");
                if(target.length > 0 && target[0].dropListener){
                    if(target[0].dropListener.test(_currentDragListener.getData())) {
                        document.body.style.cursor = "copy";
                    }
                    else{
                        document.body.style.cursor = "not-allowed";
                    }
                }
                else {
                    document.body.style.cursor = "not-allowed";
                }
            }
        });
    });
})(window);