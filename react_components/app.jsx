var React = require("react"),
    Fluxxor = require("fluxxor"),
    FormBuilder = require("./formBuilder.jsx"),
    update = require('react/lib/update'),
    componentDefinitions = require('./componentDefinitions.js'),
    constants = require('./storeEvents.js');

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
        id: definition.name + "_" + newId,
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
    this.emit("change", {
        type: constants.ADD_COMPONENT,
        payload: newComponent
    });
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
    
    this.emit("change", {
        type: constants.ADD_CHILD_COMPONENT,
        payload: newComponent
    });
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
    this.emit("change", {
        type: constants.DELETE_COMPONENT,
        payload: component
    });
  },
  
  onClearComponents: function() {
    this.components = [];
    this.selectedComponent = null;
    this.emit("change", {
        type: constants.CLEAR_COMPONENTS
    });
  },
  
  onSelectComponent: function(component) {
    this.selectedComponent = component;
    this.emit("change", {
        type: constants.SELECT_COMPONENT, 
        payload: component
    });
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
    this.emit("change", {
        type: constants.MOVE_COMPONENT,
        payload: payload
    });
  },
  
  onUpdateSelectedComponent: function(component) {
    this.selectedComponent = component;
    this.emit("change", {
        type: constants.UPDATE_SELECTED_COMPONENT,
        payload: component
    });
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

var stores = {
  ComponentStore: new ComponentStore()
};

var flux = new Fluxxor.Flux(stores, actions);

React.render(<FormBuilder flux={flux} serverPostBack='http://localhost:3000/data' />, document.getElementById('app'));