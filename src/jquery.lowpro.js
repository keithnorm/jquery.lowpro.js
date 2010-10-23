var Class = {
  create: function() {
    var parent = null, properties = $.makeArray(arguments);
    if ($.isFunction(properties[0])) parent = properties.shift();


    var klass = function() {
      this.initialize.apply(this, arguments);
    };

    klass.superclass = parent;
    klass.subclasses = [];
    klass.addMethods = Class.addMethods;

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      klass.prototype = new subclass;
      parent.subclasses.push(klass);
    }

    for (var i = 0; i < properties.length; i++)
      klass.addMethods(properties[i]);

    if (!klass.prototype.initialize){
      klass.prototype.initialize = function() {};
    }

    klass.prototype.constructor = klass;

    return klass;
  },

  addMethods: function(source) {
    var ancestor   = this.superclass && this.superclass.prototype;
    var properties = [];
    for(var prop in source){
      properties.push(prop);
    }

    for (var i = 0, length = properties.length; i < length; i++) {
      var property = properties[i], value = source[property];
      if (ancestor && $.isFunction(value) && $.argumentNames(value)[0] == "$super") {

        var method = value, value = $.extend($.wrap((function(m) {
          return function() { return ancestor[m].apply(this, arguments) };
        })(property), method), {
          valueOf:  function() { return method },
          toString: function() { return method.toString() }
        });
      }
      this.prototype[property] = value;
    }

    return this;
  }
};

var Behavior = {

  create: function() {
    var parent = null, properties = arguments;
    if ($.isFunction(properties[0]))
      parent = properties.shift();

      var behavior = function() {
        var behaving = arguments.callee;
        if (!this.initialize) {
          var args = arguments;

          return function() {
            var initArgs = [this].concat(args);
            behavior.attach.apply(behaving, initArgs);
          };
        } else {
          // first two args are element and selector
          var args = (arguments.length == 3 && arguments[2] instanceof Array) ?
                      arguments[2] : Array.prototype.slice.call(arguments, 2);

          this.element = $(arguments[0]);
          this.selector = arguments[1];
          this.initialize.apply(this, args);
          behaving._bindEvents(this);
          behaving.instances.push(this);
        }
      };

    $.extend(behavior, Behavior.ClassMethods);
    behavior.superclass = parent;
    behavior.subclasses = [];
    behavior.instances = [];
    behavior.addMethods = Class.addMethods;

    if (parent) {
      var subclass = function() { };
      subclass.prototype = parent.prototype;
      behavior.prototype = new subclass;
      parent.subclasses.push(behavior);
    }

    for (var i = 0; i < properties.length; i++)
      behavior.addMethods(properties[i]);

    if (!behavior.prototype.initialize)
      behavior.prototype.initialize = function(){};


    behavior.prototype.constructor = behavior;
    return behavior;
  },

  ClassMethods : {
    attach : function(element, selector) {
      return new this(element, selector, Array.prototype.slice.call(arguments, 2));
    },

    _bindEvents : function(instance) {
      for (var member in instance) {
        if (member.match(/^on(.+)/) && typeof instance[member] == 'function') {
          instance.element.bind(RegExp.$1, $.bind(instance[member], instance));
        }
      }
    }
  },

  InstanceMethods: {
    trigger: function(eventType, extraParameters) {
      var parameters = [this].concat(extraParameters);
      this.element.trigger(eventType, parameters);
    }
  }
};

(function($) {

  $.extend({
    keys: function(obj) {
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    },

    argumentNames: function(func) {
      var names = func.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(/, ?/);
      return names.length == 1 && !names[0] ? [] : names;
    },

    bind: function(func, scope) {
      return function() {
        return func.apply(scope, $.makeArray(arguments));
      }
    },

    wrap: function(func, wrapper) {
      var __method = func;
      return function() {
        return wrapper.apply(this, [$.bind(__method, this)].concat($.makeArray(arguments)));
      }
    },

    delegate: function(rules) {
      return function(e) {
        var target = $(e.target), parent = null;
        for (var selector in rules) {
          if (target.is(selector) || ((parent = target.parents(selector)) && parent.length > 0)) {
            return rules[selector].apply(this, [parent || target].concat($.makeArray(arguments)));
          }
          parent = null;
        }
      }
    }
  });


  var attachBehavior = function(el, behavior, args) {
      if(behavior.attach){
        instance = behavior.attach(el, args[0].selector);
        if (!behavior.instances) behavior.instances = [];
        behavior.instances.push(instance);
        return instance;
      }

      else
        behavior.call(el);
  };


  $.fn.extend({
    attach: function() {
      var args = $.makeArray(arguments), behavior = args.shift();

      for (var member in behavior.prototype) {
        if (member.match(/^on(.+)/) && typeof behavior.prototype[member] == 'function') {
          $(this.selector).live(RegExp.$1, function(event) {
            if($(this).attached(behavior) == 0){
              event.preventDefault();
              $(this).die(event.type);
              var instance = new behavior(this);
              instance['on' + event.type].call(instance, $(this));
            }
          })
        }
      }
      return this.each(function() {
        attachBehavior(this, behavior, args);
      });
    },
    attachAndReturn: function() {
      var args = $.makeArray(arguments), behavior = args.shift();

      return $.map(this, function(el) {
        return attachBehavior(el, behavior, args);
      });
    },
    delegate: function(type, rules) {
      return this.bind(type, $.delegate(rules));
    },
    attached: function(behavior) {
      var instances = [];

      if (!behavior.instances) return instances;

      this.each(function(i, element) {
        $.each(behavior.instances, function(i, instance) {
          if (instance.element.get(0) == element) instances.push(instance);
        });
      });

      return instances;
    },
    firstAttached: function(behavior) {
      return this.attached(behavior)[0];
    }
  });

  Remote = Class.create({
    initialize: function(options) {
      if (this.element.attr('nodeName') == 'FORM') this.element.attach(Remote.Form, options);
      else this.element.attach(Remote.Link, options);
    }
  });

  Remote.Base = Class.create({
    initialize : function(options) {
      this.options = options;
    },
    _makeRequest : function(options) {
      $.ajax(options);
      return false;
    }
  });

  Remote.Link = Class.create(Remote.Base, {
    onclick: function() {
      var options = $.extend({ 
        url: this.element.attr('href'), 
        type: 'GET' 
      }, this.options);
      return this._makeRequest(options);
    }
  });

  Remote.Form = Class.create(Remote.Base, {
    onclick: function(e) {
      var target = e.target;

      if ($.inArray(target.nodeName.toLowerCase(), ['input', 'button']) >= 0 && target.type.match(/submit|image/))
        this._submitButton = target;
    },
    onsubmit: function() {
      var data = this.element.serializeArray();

      if (this._submitButton) data.push({ name: this._submitButton.name, value: this._submitButton.value });

      var options = $.extend({
        url : this.element.attr('action'),
        type : this.element.attr('method') || 'GET',
        data : data
      }, this.options);

      this._makeRequest(options);

      return false;
    }
  });

  $.ajaxSetup({
    beforeSend: function(xhr) {
      if (!this.dataType)
        xhr.setRequestHeader("Accept", "text/javascript, text/html, application/xml, text/xml, */*");
    }
  });

})(jQuery);


//some prototype bridge sugar
var Event = {
  possibleEvents: ('blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove ' +
  'mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error').split(' ') 
};

Event.addBehavior = function(rules) {
  $(function(){
    for(var rule in rules){
      var selectors = rule;
      var behavior = rules[rule];
      $.each(selectors.split(/,\s+/), function(index, selector){
        var parts = selector.split(new RegExp(':(' + Event.possibleEvents.join('|') + ')')), css = parts[0], event = parts[1];
        if(event)
          $(css).bind(event, behavior);
        else {
          $(css).attach(behavior, {selector: css});
        }
      });
    };
  });
};

Event.onReady = function(callback) {
  $(callback);
};

Event.delegate = $.delegate;
