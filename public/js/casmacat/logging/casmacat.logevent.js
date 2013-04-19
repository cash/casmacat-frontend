"use strict"; // strict scope for the whole file

/**
 * jQuery CASMACAT logevent object and factory
 * Author: Ragnar Bonk
 *
 * Dependencies:
 *  - debug.js [optional]
 *
 * Supported Browsers:
 *  - Firefox >= 15
 *  - Chrome >= 22.0.1229.79 m
 *  - IE >= 9 (no eye tracking) (TODO needs intensive testing -> DOMSubtreeModified stuff)
 *  - Opera >= 12.02 (no eye tracking, no contentenditable)
 *
 *  TODO testing with QUnit?
 */

/**
 * A logevent factory to construct concrete logevents
 */
var LogEventFactory = function(elementIdMode) {
    this.elementIdMode = elementIdMode;

    this.START_SESSION = "startSession";
    this.STOP_SESSION = "stopSession";
    this.TEXT = "text";
    this.SELECTION = "selection";
    this.GAZE = "gaze";
    this.FIXATION = "fixation";
    this.SCROLL = "scroll";
    this.RESIZE = "resize";
    this.DRAFTED = "drafted";
    this.TRANSLATED = "translated";
    this.APPROVED = "approved";
    this.REJECTED = "rejected";
    this.VIEWPORT_TO_SEGMENT = "viewportToSegment";
    this.SOURCE_COPIED = "sourceCopied";
    this.SEGMENT_OPENED = "segmentOpened";
    this.SEGMENT_CLOSED = "segmentClosed";
    this.LOADING_SUGGESTIONS = "loadingSuggestions";
    this.SUGGESTIONS_LOADED = "suggestionsLoaded";
    this.SUGGESTION_CHOSEN = "suggestionChosen";

    this.DECODE = "decode";
    this.ALIGNMENTS = "alignments";
    this.SUFFIX_CHANGE = "suffixChange";
    this.CONFIDENCES = "confidences";
    this.TOKENS = "tokens";
    this.SHOW_ALIGNMENT_BY_MOUSE = "showAlignmentByMouse";
    this.HIDE_ALIGNMENT_BY_MOUSE = "hideAlignmentByMouse";
    this.SHOW_ALIGNMENT_BY_KEY = "showAlignmentByKey";
    this.HIDE_ALIGNMENT_BY_KEY = "hideAlignmentByKey";

    this.KEY_DOWN = "keyDown";
    this.KEY_UP = "keyUp";

    this.MOUSE_DOWN = "mouseDown";
    this.MOUSE_UP = "mouseUp";
    this.MOUSE_CLICK = "mouseClick";
    this.MOUSE_MOVE = "mouseMove";

    this.BEFORE_CUT = "beforeCut";
    this.BEFORE_COPY = "beforeCopy";
    this.BEFORE_PASTE = "beforePaste";
};

/**
 * Constructs a new concrete logevent
 */
LogEventFactory.prototype.newLogEvent = function(type, element) {

    var logEvent = new Object();
    logEvent.type = type;                   // type of the event
    logEvent.time = (new Date()).getTime(); // exact time when the event occured (formerly: time offset in ms from the
                                            // start time of this logging session)
    logEvent.elementId = null;              // id of the element in the UI
    logEvent.xPath = null;                  // XPath-like expression giving the path to the element. Absolute, when
                                            // running in 'elementIdDetection=xPath' mode, relative to the next parent
                                            // element that has an id if running in 'elementIdDetection=hybrid' mode

    if (!element.tagName || element.tagName.toLowerCase() == "html") {
//        debug("LogEventFactory.newLogEvent(): Special case, returning 'LogEvent': type: '" + logEvent.type + "', id: 'window'.");
        logEvent.elementId = "window";         // id of the element in the UI
    }
    else if (this.elementIdMode == "xPath") {
//        debug("LogEventFactory.newLogEvent(): Returning 'LogEvent': type: '" + logEvent.type + "', absolute xPath: '" + $(element).getAbsoluteXPath() + "'.");
        logEvent.xPath = $(element).getAbsoluteXPath();
    }
    else if (this.elementIdMode == "id") {
        if (!element.id) {
            alert("Element '" + $(element).getAbsoluteXPath() + "' has no id!'");
            $.error("Element '" + $(element).getAbsoluteXPath() + "' has no id");
        }
        else {
//            debug("LogEventFactory.newLogEvent(): Returning 'LogEvent': type: '" + logEvent.type + "', element id: '" + element.id + "'.");
            logEvent.elementId = element.id;
        }
    }
    else {  // hybrid mode
        var elementId = $(element).getElementId();
//        debug("LogEventFactory.newLogEvent(): Returning 'LogEvent': type: '" + logEvent.type + "', hybrid id: '" + elementId.id + "*" + elementId.xPath
//            + "'.");
        logEvent.elementId = elementId.id;
        logEvent.xPath = elementId.xPath;
    }

    if (logEvent.xPath === null) {
        logEvent.xPath = "";
    }

    switch (type) {
        case this.START_SESSION:
            break;
        case this.STOP_SESSION:
            break;

        case this.TEXT:    // cursorPosition, deleted, inserted
            logEvent.cp = arguments[2];
            logEvent.d = arguments[3];
            logEvent.i = arguments[4];
            break;
        case this.SELECTION:    // range
            var range = arguments[2];
            logEvent.startNodeId = range.startNodeId;
            logEvent.startNodeXPath = range.startNodeXPath;
            logEvent.sCursorPosition = range.sCursorPosition;
            logEvent.endNodeId = range.endNodeId;
            logEvent.endNodeXPath = range.endNodeXPath;
            logEvent.eCursorPosition = range.eCursorPosition;
            logEvent.selectedText = range.selectedText;
            break;

        case this.GAZE: // time, leftX, leftY, rightX, rightY, leftDilation, rightDilation
            logEvent.tt = arguments[2];
            logEvent.lx = arguments[3];
            logEvent.ly = arguments[4];
            logEvent.rx = arguments[5];
            logEvent.ry = arguments[6];
            logEvent.ld = arguments[7];
            logEvent.rd = arguments[8];
            logEvent.lc = arguments[9];
            logEvent.lo = arguments[10];
            logEvent.rc = arguments[11];
            logEvent.ro = arguments[12];
            break;
        case this.FIXATION: // time, x, y, duration
            logEvent.tt = arguments[2];
            logEvent.x = arguments[3];
            logEvent.y = arguments[4];
            logEvent.d = arguments[5];
            logEvent.c = arguments[6];
            logEvent.o = arguments[7];
            break;

        case this.SCROLL:    // offset
            logEvent.offset = arguments[2];
            break;
        case this.RESIZE:    // width, height
            logEvent.width = arguments[2];
            logEvent.height = arguments[3];
            break;

        case this.DRAFTED:
            break;
        case this.TRANSLATED:
            break;
        case this.APPROVED:
            break;
        case this.REJECTED:
            break;

        case this.VIEWPORT_TO_SEGMENT:
            break;
        case this.SOURCE_COPIED:
            break;
        case this.SEGMENT_OPENED:
            break;
        case this.SEGMENT_CLOSED:
            break;

        case this.LOADING_SUGGESTIONS:
            break;
        case this.SUGGESTIONS_LOADED:    // matches
            logEvent.matches = arguments[2];
            break;
        case this.SUGGESTION_CHOSEN:    // which, translation
            logEvent.which = arguments[2];
            logEvent.translation = arguments[3];
            break;

        case this.DECODE:    // data
        case this.ALIGNMENTS:    // data
        case this.SUFFIX_CHANGE:    // data
        case this.CONFIDENCES:    // data
        case this.TOKENS:    // data
        case this.SHOW_ALIGNMENT_BY_KEY:
        case this.HIDE_ALIGNMENT_BY_KEY:
            logEvent.data = arguments[2];
            break;
        case this.SHOW_ALIGNMENT_BY_MOUSE:
        case this.HIDE_ALIGNMENT_BY_MOUSE:
            break;

        case this.KEY_DOWN:
        case this.KEY_UP:
            logEvent.cursorPosition = arguments[2];
            logEvent.which = arguments[3];
            //logEvent.character = arguments[4];
            logEvent.mappedKey = arguments[4];
            logEvent.shift = arguments[5];
            logEvent.ctrl = arguments[6];
            logEvent.alt = arguments[7];
            break;

        case this.MOUSE_DOWN:
        case this.MOUSE_UP:
        case this.MOUSE_CLICK:
        case this.MOUSE_MOVE:
            logEvent.which = arguments[2];
            logEvent.x = arguments[3];
            logEvent.y = arguments[4];
            logEvent.shift = arguments[5];
            logEvent.ctrl = arguments[6];
            logEvent.alt = arguments[7];
            logEvent.cursorPosition = arguments[8];
            break;

        case this.BEFORE_CUT:
        case this.BEFORE_COPY:
        case this.BEFORE_PASTE:
            break;

        default:
            alert("Unknown event type: '" + $(element).getAbsoluteXPath() + "'!");
            $.error("Unknown event type: '" + $(element).getAbsoluteXPath() + "'");
    }

    return logEvent;
};
