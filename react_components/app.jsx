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
    this.components =  [];
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
  
  onAddComponent: function(component) {
    component.id = this.idIncrementAndGet();
    this.components.push(component);
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
      selectedComponent: this.selectedComponent
    };
  }
});  

var actions = {
  addComponent: function(component) {
    this.dispatch(constants.ADD_COMPONENT, component);
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

React.render(<FormBuilder flux={flux} />, document.getElementById('app'));