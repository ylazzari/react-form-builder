(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
'use strict';

var DragDropDispatcher = require('../dispatcher/DragDropDispatcher'),
    DragDropActionTypes = require('../constants/DragDropActionTypes');

var DragDropActionCreators = {
  startDragging:function(itemType, item, effectsAllowed) {
    DragDropDispatcher.handleAction({
      type: DragDropActionTypes.DRAG_START,
      itemType: itemType,
      item: item,
      effectsAllowed: effectsAllowed
    });
  },

  recordDrop:function(dropEffect) {
    DragDropDispatcher.handleAction({
      type: DragDropActionTypes.DROP,
      dropEffect: dropEffect
    });
  },

  endDragging:function() {
    DragDropDispatcher.handleAction({
      type: DragDropActionTypes.DRAG_END
    });
  }
};

module.exports = DragDropActionCreators;
},{"../constants/DragDropActionTypes":4,"../dispatcher/DragDropDispatcher":9}],4:[function(require,module,exports){
'use strict';

var keyMirror = require('react/lib/keyMirror');

var DragDropActionTypes = keyMirror({
  DRAG_START: null,
  DRAG_END: null,
  DROP: null
});

module.exports = DragDropActionTypes;
},{"react/lib/keyMirror":62}],5:[function(require,module,exports){
'use strict';

var DropEffects = {
  COPY: 'copy',
  MOVE: 'move',
  LINK: 'link'
};

module.exports = DropEffects;
},{}],6:[function(require,module,exports){
'use strict';

var keyMirror = require('react/lib/keyMirror');

var HorizontalDragAnchors = keyMirror({
  LEFT: null,
  CENTER: null,
  RIGHT: null
});

module.exports = HorizontalDragAnchors;
},{"react/lib/keyMirror":62}],7:[function(require,module,exports){
'use strict';

var keyMirror = require('react/lib/keyMirror');

var NativeDragItemTypes = {
  FILE: '__NATIVE_FILE__'
};

module.exports = NativeDragItemTypes;
},{"react/lib/keyMirror":62}],8:[function(require,module,exports){
'use strict';

var keyMirror = require('react/lib/keyMirror');

var VerticalDragAnchors = keyMirror({
  TOP: null,
  CENTER: null,
  BOTTOM: null
});

module.exports = VerticalDragAnchors;
},{"react/lib/keyMirror":62}],9:[function(require,module,exports){
'use strict';

var Dispatcher = require('flux').Dispatcher,
    assign = require('react/lib/Object.assign');

var DragDropDispatcher = assign(new Dispatcher(), {
  handleAction:function(action) {
    this.dispatch({
      action: action
    });
  }
});

module.exports = DragDropDispatcher;
},{"flux":29,"react/lib/Object.assign":60}],10:[function(require,module,exports){
'use strict';

module.exports = {
  DragDropMixin: require('./mixins/DragDropMixin'),
  ImagePreloaderMixin: require('./mixins/ImagePreloaderMixin'),
  HorizontalDragAnchors: require('./constants/HorizontalDragAnchors'),
  VerticalDragAnchors: require('./constants/VerticalDragAnchors'),
  NativeDragItemTypes: require('./constants/NativeDragItemTypes'),
  DropEffects: require('./constants/DropEffects')
};
},{"./constants/DropEffects":5,"./constants/HorizontalDragAnchors":6,"./constants/NativeDragItemTypes":7,"./constants/VerticalDragAnchors":8,"./mixins/DragDropMixin":11,"./mixins/ImagePreloaderMixin":12}],11:[function(require,module,exports){
'use strict';

var DragDropActionCreators = require('../actions/DragDropActionCreators'),
    DragDropStore = require('../stores/DragDropStore'),
    NativeDragDropSupport = require('../utils/NativeDragDropSupport'),
    EnterLeaveMonitor = require('../utils/EnterLeaveMonitor'),
    MemoizeBindMixin = require('./MemoizeBindMixin'),
    DropEffects = require('../constants/DropEffects'),
    configureDataTransfer = require('../utils/configureDataTransfer'),
    isFileDragDropEvent = require('../utils/isFileDragDropEvent'),
    bindAll = require('../utils/bindAll'),
    invariant = require('react/lib/invariant'),
    assign = require('react/lib/Object.assign'),
    defaults = require('lodash-node/modern/objects/defaults'),
    union = require('lodash-node/modern/arrays/union'),
    without = require('lodash-node/modern/arrays/without'),
    isArray = require('lodash-node/modern/objects/isArray'),
    isObject = require('lodash-node/modern/objects/isObject'),
    noop = require('lodash-node/modern/utilities/noop');

function checkValidType(component, type) {
  invariant(
    type && typeof type === 'string',
    'Expected item type to be a non-empty string. See %s',
    component.constructor.displayName
  );
}

function checkDragSourceDefined(component, type) {
  var displayName = component.constructor.displayName;

  invariant(
    component._dragSources[type],
    'There is no drag source for "%s" registered in %s. ' +
    'Have you forgotten to register it? ' +
    'See configureDragDrop in %s',
    type,
    displayName,
    displayName
  );
}

function checkDropTargetDefined(component, type) {
  var displayName = component.constructor.displayName;

  invariant(
    component._dropTargets[type],
    'There is no drop target for "%s" registered in %s. ' +
    'Have you forgotten to register it? ' +
    'See configureDragDrop in %s',
    type,
    displayName,
    displayName
  );
}

var UNLIKELY_CHAR = String.fromCharCode(0xD83D, 0xDCA9);

function hashStringArray(arr) {
  return arr.join(UNLIKELY_CHAR);
}

var DefaultDragSource = {
  canDrag:function() {
    return true;
  },

  beginDrag:function() {
    invariant(false, 'Drag source must contain a method called beginDrag. See https://github.com/gaearon/react-dnd#drag-source-api');
  },

  endDrag: noop
};

var DefaultDropTarget = {
  canDrop:function() {
    return true;
  },

  getDropEffect:function(allowedEffects) {
    return allowedEffects[0];
  },

  enter: noop,
  over: noop,
  leave: noop,
  acceptDrop: noop
};

/**
 * Use this mixin to define drag sources and drop targets.
 */
var DragDropMixin = {
  mixins: [MemoizeBindMixin],

  getInitialState:function() {
    var state = {
      ownDraggedItemType: null,
      currentDropEffect: null
    };

    return assign(state, this.getStateFromDragDropStore());
  },

  getActiveDropTargetType:function() {
    var $__0=      this.state,draggedItemType=$__0.draggedItemType,draggedItem=$__0.draggedItem,ownDraggedItemType=$__0.ownDraggedItemType,
        dropTarget = this._dropTargets[draggedItemType];

    if (!dropTarget) {
      return null;
    }

    if (draggedItemType === ownDraggedItemType) {
      return null;
    }

    var $__1=    dropTarget,canDrop=$__1.canDrop;
    return canDrop(draggedItem) ? draggedItemType : null;
  },

  isAnyDropTargetActive:function(types) {
    return types.indexOf(this.getActiveDropTargetType()) > -1;
  },

  getStateFromDragDropStore:function() {
    return {
      draggedItem: DragDropStore.getDraggedItem(),
      draggedItemType: DragDropStore.getDraggedItemType()
    };
  },

  getDragState:function(type) {
    checkValidType(this, type);
    checkDragSourceDefined(this, type);

    return {
      isDragging: this.state.ownDraggedItemType === type
    };
  },

  getDropState:function(type) {
    checkValidType(this, type);
    checkDropTargetDefined(this, type);

    var isDragging = this.getActiveDropTargetType() === type,
        isHovering = !!this.state.currentDropEffect;

    return {
      isDragging: isDragging,
      isHovering: isDragging && isHovering
    };
  },

  componentWillMount:function() {
    this._monitor = new EnterLeaveMonitor();
    this._dragSources = {};
    this._dropTargets = {};

    invariant(this.configureDragDrop, 'Implement configureDragDrop(registerType) to use DragDropMixin');
    this.configureDragDrop(this.registerDragDropItemTypeHandlers);
  },

  componentDidMount:function() {
    DragDropStore.addChangeListener(this.handleDragDropStoreChange);
  },

  componentWillUnmount:function() {
    DragDropStore.removeChangeListener(this.handleDragDropStoreChange);
  },

  registerDragDropItemTypeHandlers:function(type, handlers) {
    checkValidType(this, type);

    var $__0=     handlers,dragSource=$__0.dragSource,dropTarget=$__0.dropTarget;

    if (dragSource) {
      invariant(
        !this._dragSources[type],
        'Drag source for %s specified twice. See configureDragDrop in %s',
        type,
        this.constructor.displayName
      );

      this._dragSources[type] = defaults(bindAll(dragSource, this), DefaultDragSource);
    }

    if (dropTarget) {
      invariant(
        !this._dropTargets[type],
        'Drop target for %s specified twice. See configureDragDrop in %s',
        type,
        this.constructor.displayName
      );

      this._dropTargets[type] = defaults(bindAll(dropTarget, this), DefaultDropTarget);
    }
  },

  handleDragDropStoreChange:function() {
    if (this.isMounted()) {
      this.setState(this.getStateFromDragDropStore());
    }
  },

  dragSourceFor:function(type) {
    checkValidType(this, type);
    checkDragSourceDefined(this, type);

    return {
      draggable: true,
      onDragStart: this.memoizeBind('handleDragStart', type),
      onDragEnd: this.memoizeBind('handleDragEnd', type)
    };
  },

  handleDragStart:function(type, e) {
    var $__0=     this._dragSources[type],canDrag=$__0.canDrag,beginDrag=$__0.beginDrag;

    if (!canDrag(e)) {
      e.preventDefault();
      return;
    }

    // Some browser-specific fixes rely on knowing
    // current dragged element and its dragend handler.
    NativeDragDropSupport.handleDragStart(
      e.target,
      this.handleDragEnd.bind(this, type, null)
    );

    var dragOptions = beginDrag(e),
        $__1=       dragOptions,item=$__1.item,dragPreview=$__1.dragPreview,dragAnchors=$__1.dragAnchors,effectsAllowed=$__1.effectsAllowed;

    if (!effectsAllowed) {
      // Move is a sensible default drag effect.
      // Browser shows a drag preview anyway so we usually don't want "+" icon.
      effectsAllowed = [DropEffects.MOVE];
    }

    invariant(isArray(effectsAllowed) && effectsAllowed.length > 0, 'Expected effectsAllowed to be non-empty array');
    invariant(isObject(item), 'Expected return value of beginDrag to contain "item" object');

    configureDataTransfer(this.getDOMNode(), e.nativeEvent, dragPreview, dragAnchors, effectsAllowed);
    DragDropActionCreators.startDragging(type, item, effectsAllowed);

    // Delay setting own state by a tick so `getDragState(type).isDragging`
    // doesn't return `true` yet. Otherwise browser will capture dragged state
    // as the element screenshot.

    setTimeout(function()  {
      if (this.isMounted() && DragDropStore.getDraggedItem() === item) {
        this.setState({
          ownDraggedItemType: type
        });
      }
    }.bind(this));
  },

  handleDragEnd:function(type, e) {
    NativeDragDropSupport.handleDragEnd();

    var $__0=    this._dragSources[type],endDrag=$__0.endDrag,
        effect = DragDropStore.getDropEffect();

    DragDropActionCreators.endDragging();

    if (!this.isMounted()) {

      // Note: this method may be invoked even *after* component was unmounted
      // This happens if source node was removed from DOM while dragging.

      return;
    }

    this.setState({
      ownDraggedItemType: null
    });

    endDrag(effect, e);
  },

  dropTargetFor:function() {var types=Array.prototype.slice.call(arguments,0);
    types.forEach(function(type)  {
      checkValidType(this, type);
      checkDropTargetDefined(this, type);
    }.bind(this));

    return {
      onDragEnter: this.memoizeBind('handleDragEnter', types, hashStringArray),
      onDragOver: this.memoizeBind('handleDragOver', types, hashStringArray),
      onDragLeave: this.memoizeBind('handleDragLeave', types, hashStringArray),
      onDrop: this.memoizeBind('handleDrop', types, hashStringArray)
    };
  },

  handleDragEnter:function(types, e) {
    if (!this.isAnyDropTargetActive(types)) {
      return;
    }

    if (!this._monitor.enter(e.target)) {
      return;
    }

    var $__0=     this._dropTargets[this.state.draggedItemType],enter=$__0.enter,getDropEffect=$__0.getDropEffect,
        effectsAllowed = DragDropStore.getEffectsAllowed();

    if (isFileDragDropEvent(e)) {
      // Use Copy drop effect for dragging files.
      // Because browser gives no drag preview, "+" icon is useful.
      effectsAllowed = [DropEffects.COPY];
    }

    var dropEffect = getDropEffect(effectsAllowed);
    if (dropEffect) {
      invariant(
        effectsAllowed.indexOf(dropEffect) > -1,
        'Effect %s supplied by drop target is not one of the effects allowed by drag source: %s',
        dropEffect,
        effectsAllowed.join(', ')
      );
    }

    this.setState({
      currentDropEffect: dropEffect
    });

    enter(this.state.draggedItem, e);
  },

  handleDragOver:function(types, e) {
    if (!this.isAnyDropTargetActive(types)) {
      return;
    }

    e.preventDefault();

    var $__0=     this._dropTargets[this.state.draggedItemType],over=$__0.over,getDropEffect=$__0.getDropEffect;
    over(this.state.draggedItem, e);

    // Don't use `none` because this will prevent browser from firing `dragend`
    NativeDragDropSupport.handleDragOver(e, this.state.currentDropEffect || 'move');
  },

  handleDragLeave:function(types, e) {
    if (!this.isAnyDropTargetActive(types)) {
      return;
    }

    if (!this._monitor.leave(e.target)) {
      return;
    }

    this.setState({
      currentDropEffect: null
    });

    var $__0=    this._dropTargets[this.state.draggedItemType],leave=$__0.leave;
    leave(this.state.draggedItem, e);
  },

  handleDrop:function(types, e) {
    if (!this.isAnyDropTargetActive(types)) {
      return;
    }

    e.preventDefault();

    var item = this.state.draggedItem,
        $__0=    this._dropTargets[this.state.draggedItemType],acceptDrop=$__0.acceptDrop,
        $__1=    this.state,currentDropEffect=$__1.currentDropEffect,
        isHandled = !!DragDropStore.getDropEffect();

    if (isFileDragDropEvent(e)) {
      // We don't know file list until the `drop` event,
      // so we couldn't put `item` into the store.
      item = {
        files: Array.prototype.slice.call(e.dataTransfer.files)
      };
    }

    this._monitor.reset();

    if (!isHandled) {
      DragDropActionCreators.recordDrop(currentDropEffect);
    }

    this.setState({
      currentDropEffect: null
    });

    acceptDrop(item, e, isHandled, DragDropStore.getDropEffect());
  }
};

module.exports = DragDropMixin;

},{"../actions/DragDropActionCreators":3,"../constants/DropEffects":5,"../stores/DragDropStore":14,"../utils/EnterLeaveMonitor":15,"../utils/NativeDragDropSupport":16,"../utils/bindAll":17,"../utils/configureDataTransfer":18,"../utils/isFileDragDropEvent":24,"./MemoizeBindMixin":13,"lodash-node/modern/arrays/union":32,"lodash-node/modern/arrays/without":33,"lodash-node/modern/objects/defaults":54,"lodash-node/modern/objects/isArray":56,"lodash-node/modern/objects/isObject":57,"lodash-node/modern/utilities/noop":59,"react/lib/Object.assign":60,"react/lib/invariant":61}],12:[function(require,module,exports){
'use strict';

var getDragImageScale = require('../utils/getDragImageScale');

var TRANSPARENT_PIXEL_SRC = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

var ImagePreloaderMixin = {
  componentDidMount:function() {
    this._cachedImages = {};
    this._readyImages = {};
    this.preloadImages();
  },

  componentDidUpdate:function() {
    this.preloadImages();
  },

  componentWillUnmount:function() {
    for (var key in this._cachedImages) {
      this._cachedImages[key].src = TRANSPARENT_PIXEL_SRC;
    }

    this._cachedImages = {};
  },

  hasPreloadedImage:function(url) {
    return !!this._readyImages[url];
  },

  getPreloadedImage:function(url) {
    if (this.hasPreloadedImage(url)) {
      return this._cachedImages[url];
    }
  },

  preloadImages:function() {
    var urls = this.getImageUrlsToPreload();
    urls.forEach(this.preloadImage);
  },

  preloadImage:function(url) {
    if (!url || this._cachedImages[url]) {
      return;
    }

    var img = new Image();
    img.onload = function()  {
      if (this.isMounted()) {
        this._readyImages[url] = true;
      }
    }.bind(this);
    img.onerror = function()  {
      if (this.isMounted()) {
        delete this._cachedImages[url];
      }
    }.bind(this);
    img.src = url;

    this._cachedImages[url] = img;
  },

  getDragImageScale: getDragImageScale
};

module.exports = ImagePreloaderMixin;
},{"../utils/getDragImageScale":23}],13:[function(require,module,exports){
'use strict';

var invariant = require('react/lib/invariant');

var MemoizeBindMixin = {
  memoizeBind:function(name, argument, hasher) {
    var key = hasher ? hasher(argument) : argument;
    invariant(typeof key === 'string', 'Expected memoization key to be a string, got %s', argument);

    if (!this.__cachedBoundMethods) {
      this.__cachedBoundMethods = {};
    }

    if (!this.__cachedBoundMethods[name]) {
      this.__cachedBoundMethods[name] = {};
    }

    if (!this.__cachedBoundMethods[name][key]) {
      this.__cachedBoundMethods[name][key] = this[name].bind(this, argument);
    }

    return this.__cachedBoundMethods[name][key];
  },

  componentWillUnmount:function() {
    this.__cachedBoundMethods = {};
  }
};

module.exports = MemoizeBindMixin;
},{"react/lib/invariant":61}],14:[function(require,module,exports){
'use strict';

var DragDropDispatcher = require('../dispatcher/DragDropDispatcher'),
    DragDropActionTypes = require('../constants/DragDropActionTypes'),
    createStore = require('../utils/createStore');

var _draggedItem = null,
    _draggedItemType = null,
    _effectsAllowed = null,
    _dropEffect = null;

var DragDropStore = createStore({
  isDragging:function() {
    return !!_draggedItem;
  },

  getEffectsAllowed:function() {
    return _effectsAllowed;
  },

  getDropEffect:function() {
    return _dropEffect;
  },

  getDraggedItem:function() {
    return _draggedItem;
  },

  getDraggedItemType:function() {
    return _draggedItemType;
  }
});

DragDropDispatcher.register(function (payload) {
  var $__0=    payload,action=$__0.action;

  switch (action.type) {
  case DragDropActionTypes.DRAG_START:
    _dropEffect = null;
    _draggedItem = action.item;
    _draggedItemType = action.itemType;
    _effectsAllowed = action.effectsAllowed;
    DragDropStore.emitChange();
    break;

  case DragDropActionTypes.DROP:
    _dropEffect = action.dropEffect;
    DragDropStore.emitChange();
    break;

  case DragDropActionTypes.DRAG_END:
    _draggedItem = null;
    _draggedItemType = null;
    _effectsAllowed = null;
    _dropEffect = null;
    DragDropStore.emitChange();
    break;
  }
});

module.exports = DragDropStore;
},{"../constants/DragDropActionTypes":4,"../dispatcher/DragDropDispatcher":9,"../utils/createStore":19}],15:[function(require,module,exports){
'use strict';

var union = require('lodash-node/modern/arrays/union'),
    without = require('lodash-node/modern/arrays/without');


  function EnterLeaveMonitor() {
    this.$EnterLeaveMonitor_entered = [];
  }

  EnterLeaveMonitor.prototype.enter=function(enteringNode) {
    this.$EnterLeaveMonitor_entered = union(
      this.$EnterLeaveMonitor_entered.filter(function(node) 
        {return document.contains(node) &&
        node.contains(enteringNode);}
      ),
      [enteringNode]
    );

    return this.$EnterLeaveMonitor_entered.length === 1;
  };

  EnterLeaveMonitor.prototype.leave=function(leavingNode) {
    this.$EnterLeaveMonitor_entered = without(
      this.$EnterLeaveMonitor_entered.filter(function(node) 
        {return document.contains(node);}
      ),
      leavingNode
    );

    return this.$EnterLeaveMonitor_entered.length === 0;
  };

  EnterLeaveMonitor.prototype.reset=function() {
    this.$EnterLeaveMonitor_entered = [];
  };


module.exports = EnterLeaveMonitor;
},{"lodash-node/modern/arrays/union":32,"lodash-node/modern/arrays/without":33}],16:[function(require,module,exports){
'use strict';

var DragDropActionCreators = require('../actions/DragDropActionCreators'),
    NativeDragItemTypes = require('../constants/NativeDragItemTypes'),
    DropEffects = require('../constants/DropEffects'),
    EnterLeaveMonitor = require('../utils/EnterLeaveMonitor'),
    isFileDragDropEvent = require('./isFileDragDropEvent'),
    shallowEqual = require('react/lib/shallowEqual'),
    union = require('lodash-node/modern/arrays/union'),
    without = require('lodash-node/modern/arrays/without'),
    isWebkit = require('./isWebkit'),
    isFirefox = require('./isFirefox');

// Store global state for browser-specific fixes and workarounds
var _monitor = new EnterLeaveMonitor(),
    _currentDragTarget,
    _initialDragTargetRect,
    _imitateCurrentDragEnd,
    _dragTargetRectDidChange,
    _lastDragSourceCheckTimeout,
    _currentDropEffect;

function getElementRect(el) {
  var rect = el.getBoundingClientRect();
  // Copy so object doesn't get reused
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

function checkIfCurrentDragTargetRectChanged() {
  if (!_dragTargetRectDidChange) {
    var currentRect = getElementRect(_currentDragTarget);
    _dragTargetRectDidChange = !shallowEqual(_initialDragTargetRect, currentRect);
  }

  return _dragTargetRectDidChange;
}

function triggerDragEndIfDragSourceWasRemovedFromDOM() {
  if (_currentDragTarget &&
      _imitateCurrentDragEnd &&
      !document.contains(_currentDragTarget)) {

    _imitateCurrentDragEnd();
  }
}

function preventDefaultFileDropAction(e) {
  if (isFileDragDropEvent(e)) {
    e.preventDefault();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('dragenter', function (e) {
    preventDefaultFileDropAction(e);

    var isFirstEnter = _monitor.enter(e.target);
    if (isFirstEnter && isFileDragDropEvent(e)) {
      DragDropActionCreators.startDragging(NativeDragItemTypes.FILE, null);
    }
  });

  window.addEventListener('dragover', function (e) {
    preventDefaultFileDropAction(e);

    // At the top level of event bubbling, use previously set drop effect and reset it.
    if (_currentDropEffect) {
      e.dataTransfer.dropEffect = _currentDropEffect;
      _currentDropEffect = null;
    }

    if (!_currentDragTarget) {
      return;
    }

    if (isWebkit() && checkIfCurrentDragTargetRectChanged()) {
      // Prevent animating to incorrect position
      e.preventDefault();
    } else if (isFirefox()) {

      // Firefox won't trigger a global `drop` if source node was removed.
      // It won't trigger `mouseup` either. It *will* however trigger `dragover`
      // continually during drag, so our strategy is to simply wait until `dragover`
      // has stopped firing.

      clearTimeout(_lastDragSourceCheckTimeout);
      _lastDragSourceCheckTimeout = setTimeout(
        triggerDragEndIfDragSourceWasRemovedFromDOM,
        140 // 70 seems enough on OS X with FF33, double it to be sure
      );
    }
  });

  window.addEventListener('dragleave', function (e) {
    preventDefaultFileDropAction(e);

    var isLastLeave = _monitor.leave(e.target);
    if (isLastLeave && isFileDragDropEvent(e)) {
      DragDropActionCreators.endDragging();
    }
  });

  window.addEventListener('drop', function (e) {
    preventDefaultFileDropAction(e);

    _monitor.reset();

    if (isFileDragDropEvent(e)) {
      DragDropActionCreators.endDragging();
    } else if (!isFirefox()) {
      triggerDragEndIfDragSourceWasRemovedFromDOM();
    }
  });
}

var NativeDragDropSupport = {
  handleDragStart:function(dragTarget, imitateDragEnd) {
    _currentDragTarget = dragTarget;
    _initialDragTargetRect = getElementRect(dragTarget);
    _dragTargetRectDidChange = false;
    _imitateCurrentDragEnd = imitateDragEnd;
  },

  handleDragEnd:function() {
    _currentDragTarget = null;
    _initialDragTargetRect = null;
    _dragTargetRectDidChange = false;
    _imitateCurrentDragEnd = null;
  },

  handleDragOver:function(e, dropEffect) {
    // As event bubbles top-down, first specified effect will be used
    if (!_currentDropEffect) {
      _currentDropEffect = dropEffect;
    }
  }
};

module.exports = NativeDragDropSupport;
},{"../actions/DragDropActionCreators":3,"../constants/DropEffects":5,"../constants/NativeDragItemTypes":7,"../utils/EnterLeaveMonitor":15,"./isFileDragDropEvent":24,"./isFirefox":25,"./isWebkit":27,"lodash-node/modern/arrays/union":32,"lodash-node/modern/arrays/without":33,"react/lib/shallowEqual":63}],17:[function(require,module,exports){
'use strict';

function bindAll(obj, context) {
  if (!context) {
    context = obj;
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === 'function') {
      obj[key] = obj[key].bind(context);
    }
  }

  return obj;
}

module.exports = bindAll;
},{}],18:[function(require,module,exports){
'use strict';

var shouldUseDragPreview = require('./shouldUseDragPreview'),
    getDragImageOffset = require('./getDragImageOffset'),
    getBrowserEffectAllowed = require('./getBrowserEffectAllowed');

function configureDataTransfer(containerNode, nativeEvent, dragPreview, dragAnchors, effectsAllowed) {
  var $__0=    nativeEvent,dataTransfer=$__0.dataTransfer;

  try {
    // Firefox won't drag without setting data
    dataTransfer.setData('application/json', {});
  } catch (err) {
    // IE doesn't support MIME types in setData
  }

  if (shouldUseDragPreview(dragPreview) && dataTransfer.setDragImage) {
    var dragOffset = getDragImageOffset(containerNode, dragPreview, dragAnchors, nativeEvent);
    dataTransfer.setDragImage(dragPreview, dragOffset.x, dragOffset.y);
  }

  dataTransfer.effectAllowed = getBrowserEffectAllowed(effectsAllowed);
}

module.exports = configureDataTransfer;
},{"./getBrowserEffectAllowed":21,"./getDragImageOffset":22,"./shouldUseDragPreview":28}],19:[function(require,module,exports){
'use strict';

var EventEmitter = require('events').EventEmitter,
    assign = require('react/lib/Object.assign'),
    shallowEqual = require('react/lib/shallowEqual'),
    bindAll = require('./bindAll'),
    CHANGE_EVENT = 'change';

function createStore(spec) {
  var store = assign({
    emitChange:function() {
      this.emit(CHANGE_EVENT);
    },

    addChangeListener:function(callback) {
      this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener:function(callback) {
      this.removeListener(CHANGE_EVENT, callback);
    }
  }, spec, EventEmitter.prototype);

  store.setMaxListeners(0);
  bindAll(store);

  return store;
}

module.exports = createStore;
},{"./bindAll":17,"events":1,"react/lib/Object.assign":60,"react/lib/shallowEqual":63}],20:[function(require,module,exports){
'use strict';

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

module.exports = endsWith;
},{}],21:[function(require,module,exports){
'use strict';

var DropEffects = require('../constants/DropEffects');

function getBrowserEffectAllowed(effectsAllowed) {
  var allowCopy = effectsAllowed.indexOf(DropEffects.COPY) > -1,
      allowMove = effectsAllowed.indexOf(DropEffects.MOVE) > -1,
      allowLink = effectsAllowed.indexOf(DropEffects.LINK) > -1;

  if (allowCopy && allowMove && allowLink) {
    return 'all';
  } else if (allowCopy && allowMove) {
    return 'copyMove';
  } else if (allowLink && allowMove) {
    return 'linkMove';
  } else if (allowCopy && allowLink) {
    return 'copyLink';
  } else if (allowCopy) {
    return 'copy';
  } else if (allowMove) {
    return 'move';
  } else if (allowLink) {
    return 'link';
  } else {
    return 'none';
  }
}

module.exports = getBrowserEffectAllowed;
},{"../constants/DropEffects":5}],22:[function(require,module,exports){
'use strict';

var HorizontalDragAnchors = require('../constants/HorizontalDragAnchors'),
    VerticalDragAnchors = require('../constants/VerticalDragAnchors'),
    isFirefox = require('./isFirefox'),
    isSafari = require('./isSafari');

/**
 * Returns offset to be used as arguments for `dataTransfer.setDragImage(dragImage, x, y)`.
 * Attempts to work around browser differences, especially on high-DPI screens.
 */
function getDragImageOffset(containerNode, dragPreview, dragAnchors, e) {
  dragAnchors = dragAnchors || {};

  var containerWidth = containerNode.offsetWidth,
      containerHeight = containerNode.offsetHeight,
      isImage = dragPreview instanceof Image,
      previewWidth = isImage ? dragPreview.width : containerWidth,
      previewHeight = isImage ? dragPreview.height : containerHeight,
      horizontalAnchor = dragAnchors.horizontal || HorizontalDragAnchors.CENTER,
      verticalAnchor = dragAnchors.vertical || VerticalDragAnchors.CENTER,
      $__0=       e,offsetX=$__0.offsetX,offsetY=$__0.offsetY,node=$__0.target;

  // Work around @2x coordinate discrepancies in browsers
  if (isFirefox()) {
    offsetX = e.layerX;
    offsetY = e.layerY;
  } else if (isSafari()) {
    previewHeight /= window.devicePixelRatio;
    previewWidth /= window.devicePixelRatio;
  }

  while (node !== containerNode && containerNode.contains(node)) {
    offsetX += node.offsetLeft;
    offsetY += node.offsetTop;
    node = node.offsetParent;
  }

  switch (horizontalAnchor) {
  case HorizontalDragAnchors.LEFT:
    break;
  case HorizontalDragAnchors.CENTER:
    offsetX *= (previewWidth / containerWidth);
    break;
  case HorizontalDragAnchors.RIGHT:
    offsetX = previewWidth - previewWidth * (1 - offsetX / containerWidth);
    break;
  }

  switch (verticalAnchor) {
  case VerticalDragAnchors.TOP:
    break;
  case VerticalDragAnchors.CENTER:
    offsetY *= (previewHeight / containerHeight);
    break;
  case VerticalDragAnchors.BOTTOM:
    offsetY = previewHeight - previewHeight * (1 - offsetY / containerHeight);
    break;
  }

  // Work around Safari 8 positioning bug
  if (isSafari()) {
    // We'll have to wait for @3x to see if this is entirely correct
    offsetY += (window.devicePixelRatio - 1) * previewHeight;
  }

  return {
    x: offsetX,
    y: offsetY
  };
}

module.exports = getDragImageOffset;
},{"../constants/HorizontalDragAnchors":6,"../constants/VerticalDragAnchors":8,"./isFirefox":25,"./isSafari":26}],23:[function(require,module,exports){
'use strict';

var isFirefox = require('./isFirefox'),
    isSafari = require('./isSafari');

function getDragImageScale() {
  if (isFirefox() || isSafari()) {
    return window.devicePixelRatio;
  } else {
    return 1;
  }
}

module.exports = getDragImageScale;
},{"./isFirefox":25,"./isSafari":26}],24:[function(require,module,exports){
'use strict';

function isFileDragDropEvent(e) {
  var types = Array.prototype.slice.call(e.dataTransfer.types);
  return types.indexOf('Files') !== -1;
}

module.exports = isFileDragDropEvent;
},{}],25:[function(require,module,exports){
'use strict';

function isFirefox() {
  return /firefox/i.test(navigator.userAgent);
}

module.exports = isFirefox;
},{}],26:[function(require,module,exports){
'use strict';

function isSafari() {
  return !!window.safari;
}

module.exports = isSafari;
},{}],27:[function(require,module,exports){
'use strict';

function isWebkit() {
  return 'WebkitAppearance' in document.documentElement.style;
}

module.exports = isWebkit;
},{}],28:[function(require,module,exports){
'use strict';

var isSafari = require('./isSafari'),
    endsWith = require('./endsWith');

function shouldUseDragPreview(dragPreview) {
  if (!dragPreview) {
    return false;
  }

  if (isSafari() && dragPreview instanceof Image && endsWith(dragPreview.src, '.gif')) {
    // GIFs crash Safari
    return false;
  }

  return true;
}

module.exports = shouldUseDragPreview;
},{"./endsWith":20,"./isSafari":26}],29:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":30}],30:[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":31}],31:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],32:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseFlatten = require('../internals/baseFlatten'),
    baseUniq = require('../internals/baseUniq');

/**
 * Creates an array of unique values, in order, of the provided arrays using
 * strict equality for comparisons, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @category Arrays
 * @param {...Array} [array] The arrays to inspect.
 * @returns {Array} Returns an array of combined values.
 * @example
 *
 * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);
 * // => [1, 2, 3, 5, 4]
 */
function union() {
  return baseUniq(baseFlatten(arguments, true, true));
}

module.exports = union;

},{"../internals/baseFlatten":36,"../internals/baseUniq":38}],33:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseDifference = require('../internals/baseDifference'),
    slice = require('../internals/slice');

/**
 * Creates an array excluding all provided values using strict equality for
 * comparisons, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @category Arrays
 * @param {Array} array The array to filter.
 * @param {...*} [value] The values to exclude.
 * @returns {Array} Returns a new array of filtered values.
 * @example
 *
 * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
 * // => [2, 3, 4]
 */
function without(array) {
  return baseDifference(array, slice(arguments, 1));
}

module.exports = without;

},{"../internals/baseDifference":35,"../internals/slice":53}],34:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to pool arrays and objects used internally */
var arrayPool = [];

module.exports = arrayPool;

},{}],35:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache'),
    largeArraySize = require('./largeArraySize'),
    releaseObject = require('./releaseObject');

/**
 * The base implementation of `_.difference` that accepts a single array
 * of values to exclude.
 *
 * @private
 * @param {Array} array The array to process.
 * @param {Array} [values] The array of values to exclude.
 * @returns {Array} Returns a new array of filtered values.
 */
function baseDifference(array, values) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array ? array.length : 0,
      isLarge = length >= largeArraySize,
      result = [];

  if (isLarge) {
    var cache = createCache(values);
    if (cache) {
      indexOf = cacheIndexOf;
      values = cache;
    } else {
      isLarge = false;
    }
  }
  while (++index < length) {
    var value = array[index];
    if (indexOf(values, value) < 0) {
      result.push(value);
    }
  }
  if (isLarge) {
    releaseObject(values);
  }
  return result;
}

module.exports = baseDifference;

},{"./baseIndexOf":37,"./cacheIndexOf":39,"./createCache":41,"./largeArraySize":46,"./releaseObject":51}],36:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isArguments = require('../objects/isArguments'),
    isArray = require('../objects/isArray');

/**
 * The base implementation of `_.flatten` without support for callback
 * shorthands or `thisArg` binding.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.
 * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.
 * @param {number} [fromIndex=0] The index to start from.
 * @returns {Array} Returns a new flattened array.
 */
function baseFlatten(array, isShallow, isStrict, fromIndex) {
  var index = (fromIndex || 0) - 1,
      length = array ? array.length : 0,
      result = [];

  while (++index < length) {
    var value = array[index];

    if (value && typeof value == 'object' && typeof value.length == 'number'
        && (isArray(value) || isArguments(value))) {
      // recursively flatten arrays (susceptible to call stack limits)
      if (!isShallow) {
        value = baseFlatten(value, isShallow, isStrict);
      }
      var valIndex = -1,
          valLength = value.length,
          resIndex = result.length;

      result.length += valLength;
      while (++valIndex < valLength) {
        result[resIndex++] = value[valIndex];
      }
    } else if (!isStrict) {
      result.push(value);
    }
  }
  return result;
}

module.exports = baseFlatten;

},{"../objects/isArguments":55,"../objects/isArray":56}],37:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * The base implementation of `_.indexOf` without support for binary searches
 * or `fromIndex` constraints.
 *
 * @private
 * @param {Array} array The array to search.
 * @param {*} value The value to search for.
 * @param {number} [fromIndex=0] The index to search from.
 * @returns {number} Returns the index of the matched value or `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  var index = (fromIndex || 0) - 1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

module.exports = baseIndexOf;

},{}],38:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseIndexOf = require('./baseIndexOf'),
    cacheIndexOf = require('./cacheIndexOf'),
    createCache = require('./createCache'),
    getArray = require('./getArray'),
    largeArraySize = require('./largeArraySize'),
    releaseArray = require('./releaseArray'),
    releaseObject = require('./releaseObject');

/**
 * The base implementation of `_.uniq` without support for callback shorthands
 * or `thisArg` binding.
 *
 * @private
 * @param {Array} array The array to process.
 * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.
 * @param {Function} [callback] The function called per iteration.
 * @returns {Array} Returns a duplicate-value-free array.
 */
function baseUniq(array, isSorted, callback) {
  var index = -1,
      indexOf = baseIndexOf,
      length = array ? array.length : 0,
      result = [];

  var isLarge = !isSorted && length >= largeArraySize,
      seen = (callback || isLarge) ? getArray() : result;

  if (isLarge) {
    var cache = createCache(seen);
    indexOf = cacheIndexOf;
    seen = cache;
  }
  while (++index < length) {
    var value = array[index],
        computed = callback ? callback(value, index, array) : value;

    if (isSorted
          ? !index || seen[seen.length - 1] !== computed
          : indexOf(seen, computed) < 0
        ) {
      if (callback || isLarge) {
        seen.push(computed);
      }
      result.push(value);
    }
  }
  if (isLarge) {
    releaseArray(seen.array);
    releaseObject(seen);
  } else if (callback) {
    releaseArray(seen);
  }
  return result;
}

module.exports = baseUniq;

},{"./baseIndexOf":37,"./cacheIndexOf":39,"./createCache":41,"./getArray":42,"./largeArraySize":46,"./releaseArray":50,"./releaseObject":51}],39:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var baseIndexOf = require('./baseIndexOf'),
    keyPrefix = require('./keyPrefix');

/**
 * An implementation of `_.contains` for cache objects that mimics the return
 * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.
 *
 * @private
 * @param {Object} cache The cache object to inspect.
 * @param {*} value The value to search for.
 * @returns {number} Returns `0` if `value` is found, else `-1`.
 */
function cacheIndexOf(cache, value) {
  var type = typeof value;
  cache = cache.cache;

  if (type == 'boolean' || value == null) {
    return cache[value] ? 0 : -1;
  }
  if (type != 'number' && type != 'string') {
    type = 'object';
  }
  var key = type == 'number' ? value : keyPrefix + value;
  cache = (cache = cache[type]) && cache[key];

  return type == 'object'
    ? (cache && baseIndexOf(cache, value) > -1 ? 0 : -1)
    : (cache ? 0 : -1);
}

module.exports = cacheIndexOf;

},{"./baseIndexOf":37,"./keyPrefix":45}],40:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var keyPrefix = require('./keyPrefix');

/**
 * Adds a given value to the corresponding cache object.
 *
 * @private
 * @param {*} value The value to add to the cache.
 */
function cachePush(value) {
  var cache = this.cache,
      type = typeof value;

  if (type == 'boolean' || value == null) {
    cache[value] = true;
  } else {
    if (type != 'number' && type != 'string') {
      type = 'object';
    }
    var key = type == 'number' ? value : keyPrefix + value,
        typeCache = cache[type] || (cache[type] = {});

    if (type == 'object') {
      (typeCache[key] || (typeCache[key] = [])).push(value);
    } else {
      typeCache[key] = true;
    }
  }
}

module.exports = cachePush;

},{"./keyPrefix":45}],41:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var cachePush = require('./cachePush'),
    getObject = require('./getObject'),
    releaseObject = require('./releaseObject');

/**
 * Creates a cache object to optimize linear searches of large arrays.
 *
 * @private
 * @param {Array} [array=[]] The array to search.
 * @returns {null|Object} Returns the cache object or `null` if caching should not be used.
 */
function createCache(array) {
  var index = -1,
      length = array.length,
      first = array[0],
      mid = array[(length / 2) | 0],
      last = array[length - 1];

  if (first && typeof first == 'object' &&
      mid && typeof mid == 'object' && last && typeof last == 'object') {
    return false;
  }
  var cache = getObject();
  cache['false'] = cache['null'] = cache['true'] = cache['undefined'] = false;

  var result = getObject();
  result.array = array;
  result.cache = cache;
  result.push = cachePush;

  while (++index < length) {
    result.push(array[index]);
  }
  return result;
}

module.exports = createCache;

},{"./cachePush":40,"./getObject":43,"./releaseObject":51}],42:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = require('./arrayPool');

/**
 * Gets an array from the array pool or creates a new one if the pool is empty.
 *
 * @private
 * @returns {Array} The array from the pool.
 */
function getArray() {
  return arrayPool.pop() || [];
}

module.exports = getArray;

},{"./arrayPool":34}],43:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectPool = require('./objectPool');

/**
 * Gets an object from the object pool or creates a new one if the pool is empty.
 *
 * @private
 * @returns {Object} The object from the pool.
 */
function getObject() {
  return objectPool.pop() || {
    'array': null,
    'cache': null,
    'criteria': null,
    'false': false,
    'index': 0,
    'null': false,
    'number': null,
    'object': null,
    'push': null,
    'string': null,
    'true': false,
    'undefined': false,
    'value': null
  };
}

module.exports = getObject;

},{"./objectPool":48}],44:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/** Used to detect if a method is native */
var reNative = RegExp('^' +
  String(toString)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/toString| for [^\]]+/g, '.*?') + '$'
);

/**
 * Checks if `value` is a native function.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.
 */
function isNative(value) {
  return typeof value == 'function' && reNative.test(value);
}

module.exports = isNative;

},{}],45:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to prefix keys to avoid issues with `__proto__` and properties on `Object.prototype` */
var keyPrefix = +new Date + '';

module.exports = keyPrefix;

},{}],46:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used as the size when optimizations are enabled for large arrays */
var largeArraySize = 75;

module.exports = largeArraySize;

},{}],47:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used as the max size of the `arrayPool` and `objectPool` */
var maxPoolSize = 40;

module.exports = maxPoolSize;

},{}],48:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to pool arrays and objects used internally */
var objectPool = [];

module.exports = objectPool;

},{}],49:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** Used to determine if values are of the language type Object */
var objectTypes = {
  'boolean': false,
  'function': true,
  'object': true,
  'number': false,
  'string': false,
  'undefined': false
};

module.exports = objectTypes;

},{}],50:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var arrayPool = require('./arrayPool'),
    maxPoolSize = require('./maxPoolSize');

/**
 * Releases the given array back to the array pool.
 *
 * @private
 * @param {Array} [array] The array to release.
 */
function releaseArray(array) {
  array.length = 0;
  if (arrayPool.length < maxPoolSize) {
    arrayPool.push(array);
  }
}

module.exports = releaseArray;

},{"./arrayPool":34,"./maxPoolSize":47}],51:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var maxPoolSize = require('./maxPoolSize'),
    objectPool = require('./objectPool');

/**
 * Releases the given object back to the object pool.
 *
 * @private
 * @param {Object} [object] The object to release.
 */
function releaseObject(object) {
  var cache = object.cache;
  if (cache) {
    releaseObject(cache);
  }
  object.array = object.cache = object.criteria = object.object = object.number = object.string = object.value = null;
  if (objectPool.length < maxPoolSize) {
    objectPool.push(object);
  }
}

module.exports = releaseObject;

},{"./maxPoolSize":47,"./objectPool":48}],52:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('./objectTypes');

/** Used for native method references */
var objectProto = Object.prototype;

/** Native method shortcuts */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * A fallback implementation of `Object.keys` which produces an array of the
 * given object's own enumerable property names.
 *
 * @private
 * @type Function
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 */
var shimKeys = function(object) {
  var index, iterable = object, result = [];
  if (!iterable) return result;
  if (!(objectTypes[typeof object])) return result;
    for (index in iterable) {
      if (hasOwnProperty.call(iterable, index)) {
        result.push(index);
      }
    }
  return result
};

module.exports = shimKeys;

},{"./objectTypes":49}],53:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * Slices the `collection` from the `start` index up to, but not including,
 * the `end` index.
 *
 * Note: This function is used instead of `Array#slice` to support node lists
 * in IE < 9 and to ensure dense arrays are returned.
 *
 * @private
 * @param {Array|Object|string} collection The collection to slice.
 * @param {number} start The start index.
 * @param {number} end The end index.
 * @returns {Array} Returns the new array.
 */
function slice(array, start, end) {
  start || (start = 0);
  if (typeof end == 'undefined') {
    end = array ? array.length : 0;
  }
  var index = -1,
      length = end - start || 0,
      result = Array(length < 0 ? 0 : length);

  while (++index < length) {
    result[index] = array[start + index];
  }
  return result;
}

module.exports = slice;

},{}],54:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var keys = require('./keys'),
    objectTypes = require('../internals/objectTypes');

/**
 * Assigns own enumerable properties of source object(s) to the destination
 * object for all destination properties that resolve to `undefined`. Once a
 * property is set, additional defaults of the same property will be ignored.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {Object} object The destination object.
 * @param {...Object} [source] The source objects.
 * @param- {Object} [guard] Allows working with `_.reduce` without using its
 *  `key` and `object` arguments as sources.
 * @returns {Object} Returns the destination object.
 * @example
 *
 * var object = { 'name': 'barney' };
 * _.defaults(object, { 'name': 'fred', 'employer': 'slate' });
 * // => { 'name': 'barney', 'employer': 'slate' }
 */
var defaults = function(object, source, guard) {
  var index, iterable = object, result = iterable;
  if (!iterable) return result;
  var args = arguments,
      argsIndex = 0,
      argsLength = typeof guard == 'number' ? 2 : args.length;
  while (++argsIndex < argsLength) {
    iterable = args[argsIndex];
    if (iterable && objectTypes[typeof iterable]) {
    var ownIndex = -1,
        ownProps = objectTypes[typeof iterable] && keys(iterable),
        length = ownProps ? ownProps.length : 0;

    while (++ownIndex < length) {
      index = ownProps[ownIndex];
      if (typeof result[index] == 'undefined') result[index] = iterable[index];
    }
    }
  }
  return result
};

module.exports = defaults;

},{"../internals/objectTypes":49,"./keys":58}],55:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/** `Object#toString` result shortcuts */
var argsClass = '[object Arguments]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/**
 * Checks if `value` is an `arguments` object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.
 * @example
 *
 * (function() { return _.isArguments(arguments); })(1, 2, 3);
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == argsClass || false;
}

module.exports = isArguments;

},{}],56:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = require('../internals/isNative');

/** `Object#toString` result shortcuts */
var arrayClass = '[object Array]';

/** Used for native method references */
var objectProto = Object.prototype;

/** Used to resolve the internal [[Class]] of values */
var toString = objectProto.toString;

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;

/**
 * Checks if `value` is an array.
 *
 * @static
 * @memberOf _
 * @type Function
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an array, else `false`.
 * @example
 *
 * (function() { return _.isArray(arguments); })();
 * // => false
 *
 * _.isArray([1, 2, 3]);
 * // => true
 */
var isArray = nativeIsArray || function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number' &&
    toString.call(value) == arrayClass || false;
};

module.exports = isArray;

},{"../internals/isNative":44}],57:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var objectTypes = require('../internals/objectTypes');

/**
 * Checks if `value` is the language type of Object.
 * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if the `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(1);
 * // => false
 */
function isObject(value) {
  // check if the value is the ECMAScript language type of Object
  // http://es5.github.io/#x8
  // and avoid a V8 bug
  // http://code.google.com/p/v8/issues/detail?id=2291
  return !!(value && objectTypes[typeof value]);
}

module.exports = isObject;

},{"../internals/objectTypes":49}],58:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */
var isNative = require('../internals/isNative'),
    isObject = require('./isObject'),
    shimKeys = require('../internals/shimKeys');

/* Native method shortcuts for methods with the same name as other `lodash` methods */
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;

/**
 * Creates an array composed of the own enumerable property names of an object.
 *
 * @static
 * @memberOf _
 * @category Objects
 * @param {Object} object The object to inspect.
 * @returns {Array} Returns an array of property names.
 * @example
 *
 * _.keys({ 'one': 1, 'two': 2, 'three': 3 });
 * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)
 */
var keys = !nativeKeys ? shimKeys : function(object) {
  if (!isObject(object)) {
    return [];
  }
  return nativeKeys(object);
};

module.exports = keys;

},{"../internals/isNative":44,"../internals/shimKeys":52,"./isObject":57}],59:[function(require,module,exports){
/**
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>
 * Build: `lodash modularize modern exports="node" -o ./modern/`
 * Copyright 2012-2013 The Dojo Foundation <http://dojofoundation.org/>
 * Based on Underscore.js 1.5.2 <http://underscorejs.org/LICENSE>
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Available under MIT license <http://lodash.com/license>
 */

/**
 * A no-operation function.
 *
 * @static
 * @memberOf _
 * @category Utilities
 * @example
 *
 * var object = { 'name': 'fred' };
 * _.noop(object) === undefined;
 * // => true
 */
function noop() {
  // no operation performed
}

module.exports = noop;

},{}],60:[function(require,module,exports){
/**
 * Copyright 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.assign
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.assign

function assign(target, sources) {
  if (target == null) {
    throw new TypeError('Object.assign target cannot be null or undefined');
  }

  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    // We don't currently support accessors nor proxies. Therefore this
    // copy cannot throw. If we ever supported this then we must handle
    // exceptions and side-effects. We don't support symbols so they won't
    // be transferred.

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  return to;
};

module.exports = assign;

},{}],61:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if ("production" !== process.env.NODE_ENV) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

}).call(this,require('_process'))
},{"_process":2}],62:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyMirror
 * @typechecks static-only
 */

"use strict";

var invariant = require("./invariant");

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  ("production" !== process.env.NODE_ENV ? invariant(
    obj instanceof Object && !Array.isArray(obj),
    'keyMirror(...): Argument must be an object.'
  ) : invariant(obj instanceof Object && !Array.isArray(obj)));
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

}).call(this,require('_process'))
},{"./invariant":61,"_process":2}],63:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule shallowEqual
 */

"use strict";

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB. Returns true when the values of all keys are strictly equal.
 *
 * @return {boolean}
 */
function shallowEqual(objA, objB) {
  if (objA === objB) {
    return true;
  }
  var key;
  // Test for A's keys different from B.
  for (key in objA) {
    if (objA.hasOwnProperty(key) &&
        (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B's keys missing from A.
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

module.exports = shallowEqual;

},{}],64:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");

var ActionIcon = React.createClass({displayName: 'ActionIcon',
  render: function() {
    return (React.createElement("span", {onClick: this.props.onClick, className: "fa " + this.props.icon + " action-item"}));
  }
});

module.exports = ActionIcon;
},{"react":"react"}],65:[function(require,module,exports){
var React = require("react");
var Fluxxor = require("fluxxor");
var DragDropMixin = require('react-dnd').DragDropMixin;
var FormBuilder = require("./formBuilder.jsx");

var constants = {
  ADD_COMPONENT: "ADD_COMPONENT",
  DELETE_COMPONENT: "DELETE_COMPONENT",
  CLEAR_COMPONENTS: "CLEAR_COMPONENTS",
  SELECT_COMPONENT: "SELECT_COMPONENT"
};

var ComponentStore = Fluxxor.createStore({
  initialize: function() {
    this.components = [];
    this.definitions = [
    {
        icon: "fa-columns",
        name: "Panel",
        componentClass: ""
    }, 
    {
        icon: "fa-text-width",
        name: "Field Edit",
        componentClass: ""
    }];
    this.selectedComponent = null;
    this.nextId = 0;
    
    this.bindActions(
      constants.ADD_COMPONENT, this.onAddComponent,
      constants.DELETE_COMPONENT, this.onDeleteComponent,
      constants.CLEAR_COMPONENTS, this.onClearComponents,
      constants.SELECT_COMPONENT, this.onSelectComponent
    );
  },
  
  idIncrementAndGet: function() {
    this.nextId++;
    return this.nextId;
  },
  
  onAddComponent: function(payload) {
    var newId = this.idIncrementAndGet();
    var newComponent = {
        id: newId,
        definition: payload.definition,
        label: payload.definition.name + " " + newId
    }    
    if (payload.index === undefined) {
        this.components.push(newComponent);
    } else {
        this.components.splice(payload.index, 0, newComponent);
    }
    this.selectedComponent = newComponent;
    this.emit("change");
  },
  
  onDeleteComponent: function(index) {
    if (this.selectedComponent === this.components[index]) {
      this.selectedComponent = null;
    }
    this.components.splice(index, 1);
    this.emit("change");
  },
  
  onClearComponents: function() {
    this.components = [];
    this.selectedComponent = null;
    this.emit("change");
  },
  
  onSelectComponent: function(index) {
    this.selectedComponent = this.components[index];
    this.emit("change");
  },
  
  getState: function() {
    return {
      components: this.components,
      selectedComponent: this.selectedComponent,
      definitions: this.definitions
    };
  }
});  

var actions = {
  addComponent: function(definition, index) {
    this.dispatch(constants.ADD_COMPONENT, {
        definition: definition, 
        index: index
    });
  },
  
  deleteComponent: function(index) {
    this.dispatch(constants.DELETE_COMPONENT, index);
  },
  
  clearComponents: function() {
    this.dispatch(constants.CLEAR_COMPONENTS);
  },
  
  selectComponent: function(index) {
    this.dispatch(constants.SELECT_COMPONENT, index);
  }
};

var stores = {
  ComponentStore: new ComponentStore()
};

var flux = new Fluxxor.Flux(stores, actions);

React.render(React.createElement(FormBuilder, {flux: flux}), document.getElementById('app'));
},{"./formBuilder.jsx":72,"fluxxor":"fluxxor","react":"react","react-dnd":10}],66:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");

var ComponentEdit = React.createClass({displayName: 'ComponentEdit',
  render: function() {
    if (this.props.component) {
        return (React.createElement("div", {className: "component-edit"}, "Selected component " + this.props.component.label + " (" + this.props.component.id + ")"));
    } else {
        return null;
    }
  }
});

module.exports = ComponentEdit;
},{"react":"react"}],67:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var ComponentToolbarItem = require("./componentToolbarItem.jsx");

var ComponentToolbar = React.createClass({displayName: 'ComponentToolbar',
    render: function() {
        return (
        React.createElement("div", {className: "component-toolbar container-fluid"}, 
        this.props.items.map(function(item) {
            return (React.createElement(ComponentToolbarItem, {key: item.name, item: item}));
        }.bind(this))
        )
        );
    }
});

module.exports = ComponentToolbar;
},{"./componentToolbarItem.jsx":68,"react":"react"}],68:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentToolbarItem = React.createClass({displayName: 'ComponentToolbarItem',
    mixins: [DragDropMixin],
    
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dragSource: {
                beginDrag: function() {
                    return {
                        item: this.props.item
                    };
                }
            }
        });
    },
    
    render: function() {
        return (React.createElement("span", React.__spread({className: "fa " + this.props.item.icon},  this.dragSourceFor(DraggableTypes.TOOLBAR_ITEM))));
    }
});

module.exports = ComponentToolbarItem;
},{"./draggableTypes.js":71,"react":"react","react-dnd":10}],69:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var ComponentTreeItem = require("./componentTreeItem.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentTree = React.createClass({displayName: 'ComponentTree',
    mixins: [FluxMixin, DragDropMixin],

    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition) {
                    this.getFlux().actions.addComponent(definition);
                }
            }
        });
    },
  
  onComponentAdd: function(event) {
    var newComponent = {
      label: "New Component"
    };
    this.getFlux().actions.addComponent(newComponent);
  },
  
  onClearComponents: function() {
    this.getFlux().actions.clearComponents();
  },
   
  render: function() {
    
    var componentList;
    if (this.props.components.length > 0) {
        componentList = (
            React.createElement("ul", null, 
                this.props.components.map(function(component, index) {
                    return (React.createElement(ComponentTreeItem, {key: component.id, index: index, component: component}));
                })
            )
        );
    }
    
    var dropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var dropStateClass = dropState.isDragging && dropState.isHovering ? 'drag-hovering' : '';

    return (
        React.createElement("div", {className: "component-tree " + dropStateClass}, 
            React.createElement("div", React.__spread({},  this.dropTargetFor(DraggableTypes.TOOLBAR_ITEM)), 
                React.createElement(ActionIcon, {icon: "fa-trash", onClick: this.onClearComponents})
            ), 
            componentList
        )
    );
  }
});

module.exports = ComponentTree;
},{"./actionIcon.jsx":64,"./componentTreeItem.jsx":70,"./draggableTypes.js":71,"fluxxor":"fluxxor","react":"react","react-dnd":10}],70:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentTreeItem = React.createClass({displayName: 'ComponentTreeItem',
    mixins: [FluxMixin, DragDropMixin],
  
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition) {
                    this.getFlux().actions.addComponent(definition, this.props.index);
                }
            }
        });
    },
  
  getIndex: function(event) {
    var $li = $(event.target).parent("li");
    return $li.data("component-index");
  },
  
  onComponentSelect: function(event) {
    var index = this.getIndex(event);
    this.getFlux().actions.selectComponent(index);
  },
  
  onComponentDelete: function(event) {
    var index = this.getIndex(event);
    this.getFlux().actions.deleteComponent(index);
  },
  
  render: function() {        
    var dropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var liClasses = dropState.isDragging && dropState.isHovering ? 'drag-hovering' : '';
    return (
          React.createElement("li", React.__spread({'data-component-index': this.props.index},  this.dropTargetFor(DraggableTypes.TOOLBAR_ITEM), {className: liClasses}), 
            React.createElement("span", {className: "fa " + this.props.component.definition.icon}), 
            React.createElement("span", {onClick: this.onComponentSelect, className: "action-item"}, this.props.component.label), 
            React.createElement(ActionIcon, {icon: "fa-trash", onClick: this.onComponentDelete})
          )
      );
  }
});

module.exports = ComponentTreeItem;
},{"./actionIcon.jsx":64,"./draggableTypes.js":71,"fluxxor":"fluxxor","react":"react","react-dnd":10}],71:[function(require,module,exports){
module.exports = {
    TOOLBAR_ITEM: "toolbarItem",
    TREE_ITEM: "treeItem"
};
},{}],72:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;

var ComponentTree = require("./componentTree.jsx");
var ComponentEdit = require("./componentEdit.jsx");
var ComponentToolbar = require("./componentToolbar.jsx");

var FormBuilder = React.createClass({displayName: 'FormBuilder',
  mixins: [FluxMixin, StoreWatchMixin("ComponentStore")],
  
  getInitialState: function() {
    return {};
  },
  
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return flux.store("ComponentStore").getState();
  },
  
  render: function() {
      return (
          React.createElement("div", {className: "form-builder row"}, 
            React.createElement("div", {className: "col-md-4"}, React.createElement(ComponentToolbar, {items: this.state.definitions})), 
            React.createElement("div", {className: "col-md-4"}, React.createElement(ComponentTree, {key: "true", components: this.state.components})), 
            React.createElement("div", {className: "col-md-4"}, React.createElement(ComponentEdit, {key: "edit", component: this.state.selectedComponent}))
          ));
  }
});

module.exports = FormBuilder;
},{"./componentEdit.jsx":66,"./componentToolbar.jsx":67,"./componentTree.jsx":69,"fluxxor":"fluxxor","react":"react"}]},{},[64,65,66,67,68,69,70,72]);
