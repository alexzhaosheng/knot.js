(function(window){

    window.KnotTestUtility = {
        parseHTML: function(html){
            var div = document.createElement('div');
            div.innerHTML = html;
            return div.childNodes[0];
        },

        raiseDOMEvent: function(element, eventType){
            var event;
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(eventType, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = eventType;
            }

            event.eventName = eventType;
            if (document.createEvent) {
                element.dispatchEvent(event);
            } else {
                element.fireEvent("on" + event.eventType, event);
            }
        },

        clearAllKnotInfo: function(element){
            if(element.__knot)
                delete element.__knot;
            if(element.__knot_errorStatusInfo)
                delete  element.__knot_errorStatusInfo;

            if(element.__knot_attachedData)
                delete  element.__knot_attachedData;

            for(var i=0; i<element.childNodes.length; i++)
                this.clearAllKnotInfo(element.childNodes[i]);
        }
    };
})((function() {
        return this;
    })());