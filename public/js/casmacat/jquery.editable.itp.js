(function($) {
  var namespace = 'itp';
  var nsClass   = '.' + namespace;
  var ItpEvents           = require('itp-events');
  var PredictiveCatClient = require("catclient.predictive");
  require("jquery.editable");

  var itpServerCache = {};

  var itpCount = 0;

  // from jQuery.extend
  function setDefaults(target, defs) {
    if (!target) return defs;
    // Only deal with non-null/undefined values
    if (defs != null) {
      // Extend the base object
      for (name in defs) {
        src = target[name];
        copy = defs[name];

        // Prevent never-ending loop
        if (typeof copy === "undefined" || target === copy) {
          continue;
        }

        if (typeof src === "undefined") {
          target[name] = copy;
        }
        // Recurse if we're merging plain objects or arrays
        else if (jQuery.isPlainObject(copy) || jQuery.isArray(copy)) {
          setDefaults(target[name], copy);
        }
      }
    }
    return target
  }


  /**
  * Create a PredictiveCatClient connection from the URL. Connections are cached, 
  * so if a connection  was already created, it will be reused
  * @param url {String} Server URL to connect to
  */
  function getItpServer(config, element) {
    var url = config.itpServerUrl;
    var doTriggerConnect = false;
    if (!(url in itpServerCache)) {
      // Connect to a server; casmacat will receive async server responses
      var server = new PredictiveCatClient(true, config.replay, element);
      server.connect(url);
      itpServerCache[url] = server;
    } 
    else {
      if (itpServerCache[url].isConnected()) {
        doTriggerConnect = true;
      }
      else {
        itpServerCache[url].checkConnection();
      }
    }
    return { itpServer: itpServerCache[url], doTriggerConnect: doTriggerConnect };
  }

  var methods = {
    init: function(_options, _config) {
      // extend default options with user defined options
      var options = $.extend({
        debug: false, 
        sourceSelector: undefined, // selector for the HTML element that provides the source to translate
        sourceDisabled: true, // if true, the source cannot be edited by the user 
        itpServerUrl: undefined, 
        replay: false, 
      }, _options);


      return this.each(function() {
        var $this = $(this)
          , $source = $(options.sourceSelector)
          , itpRes = getItpServer(options, $(this).context.id)
          , itpServer = itpRes.itpServer
          , data = {
              $source: $source,
              $target: $this,
              itpServer: itpServer,
              config: setDefaults(_config, {
                useAlignments: true,
                useConfidences: true,
                useSuggestions: false,
                mode: 'ITP',
                prioritizer: 'none',
                priorityLength: 1,
                confidenceThresholds: { doubt: 0.4, bad: 0.03 },
                displayCaretAlign: false,
                displayShadeOffTranslatedSource: false,
                displayMouseAlign: false,
                displayConfidences: false,
                highlightValidated: false,
                highlightLastValidated: false,
                highlightPrefix: false,
                highlightSuffix: true,
                limitSuffixLength: false,
                floatPredictionDiff: false,
                confidencePredictionThreshold: 0.5,
                avoidLowConfidencePredictions: false,
              })
            };

        $this.data(namespace, data);

        $this.options = options;

        $this.editable();
        $source.editable({disabled: options.sourceDisabled});
        
        data.events = new ItpEvents($this, namespace, nsClass, data.config);
        data.events.attachEvents();

        $this.one('ready', function() {
          var $this = $(this);
          $this.editableItp('configToggles', data.config);
        });

        if (itpRes.doTriggerConnect) itpServer.trigger('connect');

        itpCount++;
      });
    },

    destroy: function() {
      return this.each(function() {
        var $this = $(this);
        if ($this.data(namespace)) {
          var $source = $this.data(namespace).$source;

          // Namespacing FTW
          $this.data(namespace).events.removeEvents();
          $this.removeData(namespace);
          $source.editable('destroy');
          $this.editable('destroy');

          itpCount--;
          //console.log("**** DESTROY ****", itpCount);
        }
      })
    },

    getOptions: function() { return this.options; },
    setOptions: function(options) { this.options = options; },

    decode: function() { 
      var data = $(this).data(namespace);
      data.itpServer.decode({source: data.$source.editable('getOriginalText')});
    },

    startSession: function() { 
      var data = $(this).data(namespace);
      data.itpServer.startSession({source: data.$source.editable('getOriginalText')});
    },

    endSession: function() { 
      var data = $(this).data(namespace);
      data.itpServer.endSession();
    },

    updateTokens: function() { 
      var data = $(this).data(namespace);
      data.itpServer.getTokens({
        source: data.$source.editable('getText'), 
        target: data.$target.editable('getText')
      });
    },

    validate: function() { 
      var data = $(this).data(namespace);
      if (data && data.itpServer) {
        data.itpServer.validate({source: data.$source.editable('getOriginalText'), target: data.$target.editable('getText')});
      }
      // if (data && data.itpServer)
      //   data.itpServer.validate({source: data.$source.editable('getText'), target: data.$target.editable('getText')});
    },

    getValidatedContributions: function() { 
      var data = $(this).data(namespace);
      data.itpServer.getValidatedContributions();
    },

    reset: function() { 
      var data = $(this).data(namespace);
      data.itpServer.reset();
    },

    trigger: function(name, evData) { 
      var data = $(this).data(namespace);
      if (data) { 
        data.itpServer.trigger(name, evData);
      }
      else {
        console.log("cannot call data.itpServer");
      }
    },

    setTargetText: function(str) { 
      var data = $(this).data(namespace);
      data.$target.editable('setText', str);
    },

    updateConfig: function(config) {
      var data = $(this).data(namespace);
      $.extend(data.config, config);
      data.itpServer.configure(data.config);
    },

    getConfig: function() {
      var data = $(this).data(namespace);
      return data.config || undefined;
    },
    
    rejectSuffix: function(caretPos, numResults) {
      var data = $(this).data(namespace);
      if (typeof(numResults) === 'undefined') numResults = 1;
      data.itpServer.rejectSuffix({
        source: data.$source.editable('getOriginalText'),
        target: data.$target.text(),
        caretPos: caretPos,
        numResults: numResults,
      });
    },

    setPrefix: function(caretPos) {
      var data = $(this).data(namespace);
      data.itpServer.setPrefix({
        source: data.$source.editable('getOriginalText'),
        target:   data.$target.text(),
        caretPos: caretPos,
        numResults: 1,    
      });
    },

    itpServer: function(str) { 
      var data = $(this).data(namespace);
      if (data) return data.itpServer;
      else return;
    },

    undo: function() {
      var memento = $(this).data(namespace).events.memento;
      if (memento) memento.undo();
    },

    redo: function() {
      var memento = $(this).data(namespace).events.memento;
      if (memento) memento.redo();
    },

    toggle: function(option, value) {
      $(this).trigger(option + "Toggle", value); 
    },

    configToggles: function(config) {
      for (attr in config) {
        $(this).editableItp('toggle', attr, config[attr]);
      }
    }
  };


  $.fn.editableItp = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || ! method) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' +  method + ' does not exist on jQuery.' + namespace);
    }    
  };

})(jQuery);
