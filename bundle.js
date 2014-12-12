(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{"_process":1}],4:[function(require,module,exports){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule keyOf
 */

/**
 * Allows extraction of a minified key. Let's the build system minify keys
 * without loosing the ability to dynamically use key strings as values
 * themselves. Pass in an object with a single key/val pair and it will return
 * you the string key of that single record. Suppose you want to grab the
 * value for a key 'className' inside of an object. Key/val minification may
 * have aliased that key to be 'xa12'. keyOf({className: null}) will return
 * 'xa12' in that case. Resolve keys you want to use once at startup time, then
 * reuse those resolutions.
 */
var keyOf = function(oneKeyObj) {
  var key;
  for (key in oneKeyObj) {
    if (!oneKeyObj.hasOwnProperty(key)) {
      continue;
    }
    return key;
  }
  return null;
};


module.exports = keyOf;

},{}],5:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule update
 */

"use strict";

var assign = require("./Object.assign");
var keyOf = require("./keyOf");
var invariant = require("./invariant");

function shallowCopy(x) {
  if (Array.isArray(x)) {
    return x.concat();
  } else if (x && typeof x === 'object') {
    return assign(new x.constructor(), x);
  } else {
    return x;
  }
}

var COMMAND_PUSH = keyOf({$push: null});
var COMMAND_UNSHIFT = keyOf({$unshift: null});
var COMMAND_SPLICE = keyOf({$splice: null});
var COMMAND_SET = keyOf({$set: null});
var COMMAND_MERGE = keyOf({$merge: null});
var COMMAND_APPLY = keyOf({$apply: null});

var ALL_COMMANDS_LIST = [
  COMMAND_PUSH,
  COMMAND_UNSHIFT,
  COMMAND_SPLICE,
  COMMAND_SET,
  COMMAND_MERGE,
  COMMAND_APPLY
];

var ALL_COMMANDS_SET = {};

ALL_COMMANDS_LIST.forEach(function(command) {
  ALL_COMMANDS_SET[command] = true;
});

function invariantArrayCase(value, spec, command) {
  ("production" !== process.env.NODE_ENV ? invariant(
    Array.isArray(value),
    'update(): expected target of %s to be an array; got %s.',
    command,
    value
  ) : invariant(Array.isArray(value)));
  var specValue = spec[command];
  ("production" !== process.env.NODE_ENV ? invariant(
    Array.isArray(specValue),
    'update(): expected spec of %s to be an array; got %s. ' +
    'Did you forget to wrap your parameter in an array?',
    command,
    specValue
  ) : invariant(Array.isArray(specValue)));
}

function update(value, spec) {
  ("production" !== process.env.NODE_ENV ? invariant(
    typeof spec === 'object',
    'update(): You provided a key path to update() that did not contain one ' +
    'of %s. Did you forget to include {%s: ...}?',
    ALL_COMMANDS_LIST.join(', '),
    COMMAND_SET
  ) : invariant(typeof spec === 'object'));

  if (spec.hasOwnProperty(COMMAND_SET)) {
    ("production" !== process.env.NODE_ENV ? invariant(
      Object.keys(spec).length === 1,
      'Cannot have more than one key in an object with %s',
      COMMAND_SET
    ) : invariant(Object.keys(spec).length === 1));

    return spec[COMMAND_SET];
  }

  var nextValue = shallowCopy(value);

  if (spec.hasOwnProperty(COMMAND_MERGE)) {
    var mergeObj = spec[COMMAND_MERGE];
    ("production" !== process.env.NODE_ENV ? invariant(
      mergeObj && typeof mergeObj === 'object',
      'update(): %s expects a spec of type \'object\'; got %s',
      COMMAND_MERGE,
      mergeObj
    ) : invariant(mergeObj && typeof mergeObj === 'object'));
    ("production" !== process.env.NODE_ENV ? invariant(
      nextValue && typeof nextValue === 'object',
      'update(): %s expects a target of type \'object\'; got %s',
      COMMAND_MERGE,
      nextValue
    ) : invariant(nextValue && typeof nextValue === 'object'));
    assign(nextValue, spec[COMMAND_MERGE]);
  }

  if (spec.hasOwnProperty(COMMAND_PUSH)) {
    invariantArrayCase(value, spec, COMMAND_PUSH);
    spec[COMMAND_PUSH].forEach(function(item) {
      nextValue.push(item);
    });
  }

  if (spec.hasOwnProperty(COMMAND_UNSHIFT)) {
    invariantArrayCase(value, spec, COMMAND_UNSHIFT);
    spec[COMMAND_UNSHIFT].forEach(function(item) {
      nextValue.unshift(item);
    });
  }

  if (spec.hasOwnProperty(COMMAND_SPLICE)) {
    ("production" !== process.env.NODE_ENV ? invariant(
      Array.isArray(value),
      'Expected %s target to be an array; got %s',
      COMMAND_SPLICE,
      value
    ) : invariant(Array.isArray(value)));
    ("production" !== process.env.NODE_ENV ? invariant(
      Array.isArray(spec[COMMAND_SPLICE]),
      'update(): expected spec of %s to be an array of arrays; got %s. ' +
      'Did you forget to wrap your parameters in an array?',
      COMMAND_SPLICE,
      spec[COMMAND_SPLICE]
    ) : invariant(Array.isArray(spec[COMMAND_SPLICE])));
    spec[COMMAND_SPLICE].forEach(function(args) {
      ("production" !== process.env.NODE_ENV ? invariant(
        Array.isArray(args),
        'update(): expected spec of %s to be an array of arrays; got %s. ' +
        'Did you forget to wrap your parameters in an array?',
        COMMAND_SPLICE,
        spec[COMMAND_SPLICE]
      ) : invariant(Array.isArray(args)));
      nextValue.splice.apply(nextValue, args);
    });
  }

  if (spec.hasOwnProperty(COMMAND_APPLY)) {
    ("production" !== process.env.NODE_ENV ? invariant(
      typeof spec[COMMAND_APPLY] === 'function',
      'update(): expected spec of %s to be a function; got %s.',
      COMMAND_APPLY,
      spec[COMMAND_APPLY]
    ) : invariant(typeof spec[COMMAND_APPLY] === 'function'));
    nextValue = spec[COMMAND_APPLY](nextValue);
  }

  for (var k in spec) {
    if (!(ALL_COMMANDS_SET.hasOwnProperty(k) && ALL_COMMANDS_SET[k])) {
      nextValue[k] = update(value[k], spec[k]);
    }
  }

  return nextValue;
}

module.exports = update;

}).call(this,require('_process'))
},{"./Object.assign":2,"./invariant":3,"./keyOf":4,"_process":1}],6:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");

var ActionIcon = React.createClass({displayName: 'ActionIcon',
  render: function() {
    return (React.createElement("span", {onClick: this.props.onClick, className: "fa " + this.props.icon + " action-item"}));
  }
});

module.exports = ActionIcon;
},{"react":"react"}],7:[function(require,module,exports){
var React = require("react");
var Fluxxor = require("fluxxor");
var DragDropMixin = require('react-dnd').DragDropMixin;
var FormBuilder = require("./formBuilder.jsx");
var update = require('react/lib/update');
var componentDefinitions = require('./componentDefinitions.jsx');
var EventHandler = require('rx-react').EventHandler;
var Rx = require('rx');
var stringify = require('json-stringify-safe');

var constants = {
  ADD_COMPONENT: "ADD_COMPONENT",
  ADD_CHILD_COMPONENT: "ADD_CHILD_COMPONENT",
  DELETE_COMPONENT: "DELETE_COMPONENT",
  CLEAR_COMPONENTS: "CLEAR_COMPONENTS",
  SELECT_COMPONENT: "SELECT_COMPONENT",
  UPDATE_SELECTED_COMPONENT: "UPDATE_SELECTED_COMPONENT",
  MOVE_COMPONENT: "MOVE_COMPONENT"
};

var ComponentStore = Fluxxor.createStore({
  initialize: function() {
    this.components = [];
    this.definitions = componentDefinitions;    
    this.selectedComponent = null;
    this.nextId = 0;
    
    this.bindActions(
      constants.ADD_COMPONENT, this.onAddComponent,
      constants.ADD_CHILD_COMPONENT, this.onAddChildComponent,
      constants.DELETE_COMPONENT, this.onDeleteComponent,
      constants.CLEAR_COMPONENTS, this.onClearComponents,
      constants.SELECT_COMPONENT, this.onSelectComponent,
      constants.MOVE_COMPONENT, this.onMoveComponent,
      constants.UPDATE_SELECTED_COMPONENT, this.onUpdateSelectedComponent
    );
  },
  
  createComponent: function(definition) {
    var newId = this.idIncrementAndGet();
    var newComponent = {
        id: newId,
        definition: definition,
        label: definition.name + " " + newId,
        children: [],
        parent: null
    };
    definition.initializeComponent(newComponent);
    return newComponent;
  },
  
  idIncrementAndGet: function() {
    this.nextId++;
    return this.nextId;
  },
  
  onAddComponent: function(payload) {
    var newComponent = this.createComponent(payload.definition);
    if (payload.beforeComponent === undefined) {
        this.components.push(newComponent);
    } else {
        this.components.splice(this.components.indexOf(payload.beforeComponent), 0, newComponent);
    }
    this.selectedComponent = newComponent;
    this.emit("change");
  },
  
  onAddChildComponent: function(payload) {
    var newComponent = this.createComponent(payload.definition);
    /*
    var updatedParent = update(payload.parentComponent, {
        children: {
            $push: [newComponent]
        }
    });
    newComponent.parent = updatedParent;
    var parentIndex = this.components.indexOf(payload.parentComponent);
    this.components[parentIndex] = updatedParent;    
    */
    
    newComponent.parent = payload.parentComponent;
    payload.parentComponent.children.push(newComponent);
    this.selectedComponent = newComponent;
    
    this.emit("change");
  },
  
  onDeleteComponent: function(component) {
    if (this.selectedComponent === component) {
      this.selectedComponent = null;
    }
    
    if (component.parent) {
        component.parent.children.splice(component.parent.children.indexOf(component), 1);
    } else {
        this.components.splice(this.components.indexOf(component), 1);
    }    
    this.emit("change");
  },
  
  onClearComponents: function() {
    this.components = [];
    this.selectedComponent = null;
    this.emit("change");
  },
  
  onSelectComponent: function(component) {
    this.selectedComponent = component;
    this.emit("change");
  },
  
  onMoveComponent: function(payload) {
    var sourceIndex = this.components.indexOf(payload.source);
    var targetIndex = this.components.indexOf(payload.target);
    var stateUpdate = {
        $splice: [
          [sourceIndex, 1],
          [targetIndex, 0, payload.source]
        ]
    };
    this.components = update(this.components, stateUpdate);
    this.emit("change");
  },
  
  onUpdateSelectedComponent: function(component) {
    this.selectedComponent = component;
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
  addComponent: function(definition, beforeComponent) {
    this.dispatch(constants.ADD_COMPONENT, {
        definition: definition, 
        beforeComponent: beforeComponent
    });
  },
  
  addChildComponent: function(definition, parentComponent) {
    this.dispatch(constants.ADD_CHILD_COMPONENT, {
        definition: definition, 
        parentComponent: parentComponent
    });
  },
  
  deleteComponent: function(component) {
    this.dispatch(constants.DELETE_COMPONENT, component);
  },
  
  clearComponents: function() {
    this.dispatch(constants.CLEAR_COMPONENTS);
  },
  
  selectComponent: function(component) {
    this.dispatch(constants.SELECT_COMPONENT, component);
  },
  
  moveComponent: function(source, target) {
    this.dispatch(constants.MOVE_COMPONENT, {source: source, target: target});
  },
  
  updateSelectedComponent: function(component) {
    this.dispatch(constants.UPDATE_SELECTED_COMPONENT, component);
  }
};

var componentStore = new ComponentStore();
var componentStoreOnChange = EventHandler.create();
componentStoreOnChange
.throttle(500)
.subscribe(function() {
    console.log("componentStoreOnChange");
    console.log(stringify(this.components, null, '\t'));
}.bind(componentStore));

/*
componentStore.on("change", function() {
    console.log("ComponentStore change");
});
*/

componentStore.on("change", componentStoreOnChange);

var stores = {
  ComponentStore: componentStore
};

var flux = new Fluxxor.Flux(stores, actions);

/*
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});
*/

React.render(React.createElement(FormBuilder, {flux: flux}), document.getElementById('app'));
},{"./componentDefinitions.jsx":8,"./formBuilder.jsx":15,"fluxxor":"fluxxor","json-stringify-safe":"json-stringify-safe","react":"react","react-dnd":"react-dnd","react/lib/update":5,"rx":"rx","rx-react":"rx-react"}],8:[function(require,module,exports){
var React = require('react');
var SectionEdit = require('./sectionEdit.jsx');
var QuestionEdit = require('./questionEdit.jsx');

module.exports = [
    {
        icon: "fa-list-alt",
        name: "Section",
        componentClass: "",
        initializeComponent: function(component) {
        },
        editClass: SectionEdit
    },
    {
        icon: "fa-question-circle",
        name: "Question",
        componentClass: "",
        initializeComponent: function(component) {
            component.questionType = "text";
        },
        editClass: QuestionEdit,
        questionTypes: 
        [
            {
                value: "textbox",
                text: "Textbox"
            },
            {
                value: "textarea",
                text: "Text Area"
            },
            {
                value: "checkbox",
                text: "Checkbox"
            },
            {
                value: "select",
                text: "Dropdown"
            },
            {
                value: "radio",
                text: "Radio Button"
            }
        ]
    }
];
},{"./questionEdit.jsx":16,"./sectionEdit.jsx":17,"react":"react"}],9:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");

var ComponentEdit = React.createClass({displayName: 'ComponentEdit',
  
  onComponentChange: function(event) {
  },

  render: function() {
    if (this.props.component) {
        return (
        React.createElement("div", {className: "component-edit"}, 
        React.createElement(this.props.component.definition.editClass, {
            component: this.props.component
        })
        )
        );
    } else {
        return null;
    }
  }
});

module.exports = ComponentEdit;
},{"react":"react"}],10:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var ComponentToolbarItem = require("./componentToolbarItem.jsx");

var ComponentToolbar = React.createClass({displayName: 'ComponentToolbar',
    render2: function() {
        return (
        React.createElement("div", {className: "component-toolbar container-fluid"}, 
        this.props.items.map(function(item) {
            return (React.createElement(ComponentToolbarItem, {key: item.name, item: item}));
        }.bind(this))
        )
        );
    },
    
    render: function() {
        return (
        React.createElement("ul", {className: "component-toolbar"}, 
        this.props.items.map(function(item) {
            return (React.createElement(ComponentToolbarItem, {key: item.name, item: item}));
        }.bind(this))
        )
        );
    }
});

module.exports = ComponentToolbar;
},{"./componentToolbarItem.jsx":11,"react":"react"}],11:[function(require,module,exports){
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
    
    render2: function() {
        return (React.createElement("span", React.__spread({className: "fa " + this.props.item.icon},  this.dragSourceFor(DraggableTypes.TOOLBAR_ITEM))));
    },
    
    render: function() {
        return (React.createElement("li", React.__spread({},  this.dragSourceFor(DraggableTypes.TOOLBAR_ITEM)), React.createElement("span", {className: "fa " + this.props.item.icon}), this.props.item.name));
    }
});

module.exports = ComponentToolbarItem;
},{"./draggableTypes.js":14,"react":"react","react-dnd":"react-dnd"}],12:[function(require,module,exports){
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
  
  onClearComponents: function() {
    this.getFlux().actions.clearComponents();
  },
  
  render: function() {
    
    var componentList;
    if (this.props.components.length > 0) {
        componentList = (
            React.createElement("ul", null, 
                this.props.components.map(function(component) {
                    var children = component.children.map(function(child) {
                        return (React.createElement(ComponentTreeItem, {key: child.id, component: child}));
                    });
                    return (React.createElement(ComponentTreeItem, {key: component.id, component: component, supportDnd: "true"}, children));
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
},{"./actionIcon.jsx":6,"./componentTreeItem.jsx":13,"./draggableTypes.js":14,"fluxxor":"fluxxor","react":"react","react-dnd":"react-dnd"}],13:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");
var ellipsis = require('./utils.js').ellipsis;

var ComponentTreeItem = React.createClass({displayName: 'ComponentTreeItem',
    mixins: [FluxMixin, DragDropMixin],
    
    getInitialProps: function() {
        return {
            supportDnd: false
        };
    },
  
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition, event, isHandled, effect) {
                    if ($(event.target).hasClass("add-child")) {
                        this.getFlux().actions.addChildComponent(definition, this.props.component);
                    } else {
                        this.getFlux().actions.addComponent(definition, this.props.component);
                    }
                }
            }
        });
        
        registerType(DraggableTypes.TREE_ITEM, {
            dragSource: {
                beginDrag: function() {
                    return {
                        item: this.props.component
                    };
                }
            },
            
            dropTarget: {
                acceptDrop: function(component, event, isHandled, effect) {
                },                
                over: function(component, event) {
                    this.getFlux().actions.moveComponent(this.props.component, component);
                },
                enter: function(component, event) {
                },
                leave: function(component, event) {
                }
            }
        });
    },
  
  onComponentSelect: function(event) {
    this.getFlux().actions.selectComponent(this.props.component);
  },
  
  onComponentDelete: function(event) {
    this.getFlux().actions.deleteComponent(this.props.component);
  },
  
  ellipsis: function(str) {
    return str;
  },
  
  renderDnd: function() {
    var toolbarItemDropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var treeItemDropState = this.getDropState(DraggableTypes.TREE_ITEM);
    var liClasses;
    if (toolbarItemDropState.isHovering) {
        liClasses += ' drag-hovering';
    } else {
        var dragState = this.getDragState(DraggableTypes.TREE_ITEM);
        if (dragState.isDragging) {
            liClasses += ' dragging';
        }
    }
    
    var children;
    if (React.Children.count(this.props.children) > 0) {
        children = (React.createElement("ul", null, this.props.children));
    }
    
    return (
          React.createElement("li", React.__spread({className: liClasses},  this.dragSourceFor(DraggableTypes.TREE_ITEM),  this.dropTargetFor(DraggableTypes.TREE_ITEM, DraggableTypes.TOOLBAR_ITEM)), 
            React.createElement("span", {className: "fa " + this.props.component.definition.icon}), 
            React.createElement("span", {onClick: this.onComponentSelect, className: "action-item"}, ellipsis(this.props.component.label, 20)), 
            React.createElement(ActionIcon, {icon: "fa-trash", onClick: this.onComponentDelete}), 
            React.createElement("span", {className: "add-child fa fa-indent"}), 
            children
          )
      );
  },
  
  renderNonDnd: function() {
    return (
          React.createElement("li", null, 
            React.createElement("span", {className: "fa " + this.props.component.definition.icon}), 
            React.createElement("span", {onClick: this.onComponentSelect, className: "action-item"}, ellipsis(this.props.component.label, 20)), 
            React.createElement(ActionIcon, {icon: "fa-trash", onClick: this.onComponentDelete})
          )
          );
  },
  
  render: function() {
    if (this.props.supportDnd) {
        return this.renderDnd();
    }
    return this.renderNonDnd();
  }
});

module.exports = ComponentTreeItem;
},{"./actionIcon.jsx":6,"./draggableTypes.js":14,"./utils.js":18,"fluxxor":"fluxxor","react":"react","react-dnd":"react-dnd"}],14:[function(require,module,exports){
module.exports = {
    TOOLBAR_ITEM: "toolbarItem",
    TREE_ITEM: "treeItem"
};
},{}],15:[function(require,module,exports){
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
        React.createElement("div", {className: "container form-builder"}, 
          React.createElement("div", {className: "row"}, 
            React.createElement("div", {className: "col-md-2"}, React.createElement(ComponentToolbar, {items: this.state.definitions})), 
            React.createElement("div", {className: "col-md-4"}, React.createElement(ComponentTree, {key: "true", components: this.state.components})), 
            React.createElement("div", {className: "col-md-6"}, React.createElement(ComponentEdit, {key: "edit", component: this.state.selectedComponent}))
          )
        )
          );
  }
});

module.exports = FormBuilder;
},{"./componentEdit.jsx":9,"./componentToolbar.jsx":10,"./componentTree.jsx":12,"fluxxor":"fluxxor","react":"react"}],16:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);

var QuestionEdit = React.createClass({displayName: 'QuestionEdit',
    mixins: [FluxMixin],

    onLabelChange: function(event) {
        this.props.component.label = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },

    onQuestionTypeChange: function(event) {
        this.props.component.questionType = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },
    
    onListOfValuesChange: function(event) {
        this.props.component.listOfValues = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },
    
    renderListOfValues: function() {
        if (this.props.component.questionType == "radio" || this.props.component.questionType == "select") {
            return (
                React.createElement("div", {className: "form-group"}, 
                    React.createElement("label", {className: "control-label col-sm-2", htmlFor: "listOfValuesInput"}, "List of values"), 
                    React.createElement("div", {className: "col-sm-10"}, 
                        React.createElement("textarea", {className: "form-control", value: this.props.component.listOfValues, onChange: this.onListOfValuesChange, rows: "5"})
                    )
                )            
            );
        }
        return null;
    },

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("h4", null, React.createElement("span", {className: "fa " + this.props.component.definition.icon}), this.props.component.label), 
                React.createElement("form", {role: "form", className: "form-horizontal"}, 
                    React.createElement("div", {className: "form-group"}, 
                        React.createElement("label", {className: "control-label col-sm-2", htmlFor: "labelInput"}, "Label"), 
                        React.createElement("div", {className: "col-sm-10"}, 
                            React.createElement("input", {type: "text", className: "form-control", id: "labelInput", value: this.props.component.label, onChange: this.onLabelChange})
                        )
                    ), 
                    React.createElement("div", {className: "form-group"}, 
                        React.createElement("label", {className: "control-label col-sm-2", htmlFor: "questionTypeInput"}, "Type"), 
                        React.createElement("div", {className: "col-sm-10"}, 
                            React.createElement("select", {className: "form-control", id: "questionTypeInput", value: this.props.component.questionType, onChange: this.onQuestionTypeChange}, 
                            this.props.component.definition.questionTypes.map(function(questionType) {
                                return (React.createElement("option", {key: questionType.value, value: questionType.value}, questionType.text));
                            })
                            )
                        )
                    ), 
                    this.renderListOfValues()
                )
            )
            );     
    }
});

module.exports = QuestionEdit;
},{"fluxxor":"fluxxor","react":"react"}],17:[function(require,module,exports){
/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var EventHandler = require('rx-react').EventHandler;
var Rx = require('rx');

var SectionEdit = React.createClass({displayName: 'SectionEdit',
    mixins: [FluxMixin],
    
    componentWillMount: function() {
        this.onLabelChangeRx = EventHandler.create();
        this.onLabelChangeRx.map(function(event) {
            return event.target.value;
        })
        .throttle(250)
        .subscribe(function(value) {
            this.props.component.label = value;
            this.getFlux().actions.updateSelectedComponent(this.props.component);
        }.bind(this));
    },
    
    onLabelChange: function(event) {
        this.props.component.label = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },

    render: function() {
        return (
            React.createElement("div", null, 
                React.createElement("h4", null, React.createElement("span", {className: "fa " + this.props.component.definition.icon}), this.props.component.label), 
                React.createElement("form", {className: "form-horizontal", role: "form"}, 
                    React.createElement("div", {className: "form-group"}, 
                        React.createElement("label", {className: "control-label col-sm-2", htmlFor: "labelInput"}, "Label"), 
                        React.createElement("div", {className: "col-sm-10"}, 
                            React.createElement("input", {type: "text", className: "form-control", id: "labelInput", value: this.props.component.label, onChange: this.onLabelChange})
                        )
                    )
                )
            )
            );    
    }
});

module.exports = SectionEdit;
},{"fluxxor":"fluxxor","react":"react","rx":"rx","rx-react":"rx-react"}],18:[function(require,module,exports){
module.exports = {
    ellipsis: function(str, length) {
        if (str && str.length > length) {
            return str.substring(0, length) + "...";
        }
        return str;
    }
}
},{}]},{},[6,7,8,9,10,11,12,13,15,16,17]);
