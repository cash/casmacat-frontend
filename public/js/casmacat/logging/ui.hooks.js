$(function(){

    // Triggers ------------------------------------------------------

    UI.triggerSuggestionChosen = function(segment, which, translation) {
        // a value of 0 for 'which' means the choice has been made by the
        // program and not by the user
        var event = $.Event("suggestionChosen");
        event.segment = segment[0];
        event.element = $(".target .editarea", segment);
        event.which = which;
        event.translation = translation;
        $(window).trigger("suggestionChosen", event);
    };

    // Overwrite UI methods ------------------------------------------------------

    debug("ui.hooks: Wrapping UI methods for logging/replay");
    var original_setContribution = UI.setContribution;
    UI.setContribution = function(segment,status,byStatus) {
        if (config.replay === 1) {
            return;
        }
        original_setContribution.call(UI, segment,status,byStatus);
    };

    var original_setTranslation = UI.setTranslation;
    UI.setTranslation = function(segment,status) {
        if (config.replay === 1) {
            return;
        }
        original_setTranslation.call(UI, segment,status);
    };

    var original_setTranslationSuccess = UI.setTranslationSuccess;
    UI.setTranslationSuccess = function(d, segment, status) {
        original_setTranslationSuccess.call(UI, d, segment, status);
        var event = $.Event("statsUpdated");
        event.segment = segment[0];
        event.stats = d.stats;
        $(window).trigger("statsUpdated", event);
    };

    var original_changeStatus = UI.changeStatus;
    UI.changeStatus = function(ob,status,byStatus) {
        if (config.replay !== 1) {
            var name = "";
            if (status == "draft") {
                name = "drafted";
            }
            else {
                name = status;
            }
            var event = $.Event(name);
            event.segment = ob;
            $(window).trigger(name, event);
        }
        original_changeStatus.call(UI, ob,status,byStatus);
    };

    var original_copySuggestionInEditarea = UI.copySuggestionInEditarea;
    UI.copySuggestionInEditarea = function(segment,translation,editarea,match,decode) {
        // text events will handle setting the editfield value on replay
        if (config.replay === 1) {
            if ($.trim(translation) != "") {
                var percentageClass = this.getPercentuageClass(match);
                editarea.addClass("fromSuggestion");
                $(".percentuage",segment).text(match).removeClass("per-orange per-green per-blue per-yellow").addClass(percentageClass).addClass("visible");
            }
            return; // do not allow translation to be set
        }
        original_copySuggestionInEditarea.call(UI, segment,translation,editarea,match,decode);
    };

    var original_openSegment = UI.openSegment;
    UI.openSegment = function(editarea) {
        original_openSegment.call(UI, editarea);

        if (config.replay !== 1) {
            var event = $.Event("segmentOpened");
            event.segment = segment[0];
            $(window).trigger("segmentOpened", event);
        }
    };

    var lastSegmentClosed = null;
    var original_closeSegment = UI.closeSegment;
    UI.closeSegment = function(segment, byButton) {
//        debug("ui.hooks: closeSegment()...");

        if (!segment) { // this fixes commit 4c320792d0 (this commit breaks showing itp translation matches tab)
            original_closeSegment.call(UI, segment, byButton);
            return;
        }

        if (lastSegmentClosed === null && byButton === 0) { // me: 0
            lastSegmentClosed = segment.prop("id");
            debug("ui.hooks: Last closed segment id: '" + lastSegmentClosed + "'.");
        }
//        UI.toSegment = undefined;
        original_closeSegment.call(UI, segment[0], byButton);
        if (lastSegmentClosed !== null && byButton === 1) { // me: 1
            if (lastSegmentClosed === segment.prop("id")) {
                debug("cat.js: Ignoring second closeSegment() call...");
                lastSegmentClosed = null;
                return;
            }
            else {
                lastSegmentClosed = null;
            }
        }

        if (segment && config.replay !== 1) {
            // when using the url:
            // http://cas.ma.cat:8080/translate/en-fr.xliff/en-fr/1127-wmwzaxwm
            // then this fires on initial load just before a 'segmentOpened'.
            // the reason is the 'lastOpenedSegment stuff of matecat'.
            // when using this url, everything is fine
            // http://cas.ma.cat:8080/translate/en-fr.xliff/en-fr/1127-wmwzaxwm#607837
            // the 'if' fixes this
            if (window.location.href.indexOf('#') > -1) {
                var event = $.Event("segmentClosed");
                event.segment = segment[0];
                $(window).trigger("segmentClosed", event);
            }
        }
    };


    var original_gotoOpenSegment = UI.gotoOpenSegment;
    UI.gotoOpenSegment = function() {
        original_gotoOpenSegment.call(UI);

        var event = $.Event("viewportToSegment");
        event.segment = this.currentSegment[0];
        $(window).trigger("viewportToSegment", event);
    };

    var original_setCurrentSegment = UI.setCurrentSegment;
    UI.setCurrentSegment = function(segment,closed) {
        if (config.replay === 1) {
            debug("cat.js: Skipping setting current segment in setCurrentSegment()...");
            return;
        }
        original_setCurrentSegment.call(UI, segment,closed);
    };

    var original_chooseSuggestion = UI.chooseSuggestion;
    UI.chooseSuggestion = function(w) {
        original_chooseSuggestion.call(UI, w);
        if (config.replay !== 1) {
            UI.triggerSuggestionChosen(this.currentSegment, w,
                $('.editor ul[data-item='+w+'] li.b .translation').text());
        }
    };

    var original_setDeleteSuggestionSuccess = UI.setDeleteSuggestionSuccess;
    UI.setDeleteSuggestionSuccess = function(d) {
        original_setDeleteSuggestionSuccess.call(UI, d);
        var event = $.Event("suggestionDeleted");
        event.segment = segment[0];
        $(window).trigger("suggestionDeleted", event);
    };

    var original_topReached = UI.topReached;
    UI.topReached = function() {
        if (config.replay === 1) {
            debug("cat.js: Skipping scrolling in topReached()...");
            return;
        }
        original_topReached.call(UI);
    };

    var original_copySource = UI.copySource;
    UI.copySource = function() {
        original_copySource.call(UI);
        var event = $.Event("sourceCopied");
        event.segment = this.currentSegment[0];
        $(window).trigger("sourceCopied", event);
    };

    var original_scrollSegment = UI.scrollSegment;
    UI.scrollSegment = function(segment) {
        if (segment.length === 0) return;
        if (config.replay === 1) {
            debug("cat.js: Skipping scrolling in scrollSegment()...");
            return;
        }
        original_scrollSegment.call(UI, segment);
    };
});
