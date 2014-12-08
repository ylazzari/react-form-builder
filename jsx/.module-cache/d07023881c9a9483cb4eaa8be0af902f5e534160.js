var $ = require("jquery");
var Boostrap = require("bootstrap");
var React = require("react");
var Fluxxor = require("fluxxor");

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
var FluxMixin = Fluxxor.FluxMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;

var ActionIcon = React.createClass({displayName: 'ActionIcon',
  render: function() {
    return (React.createElement("span", {onClick: this.props.onClick, className: "glyphicon " + this.props.icon + " action-item"}));
  }
});

var ComponentTreeItem = React.createClass({displayName: 'ComponentTreeItem',
  mixins: [FluxMixin],
  
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
      return (
          React.createElement("li", {'data-component-index': this.props.index}, 
            React.createElement("span", {onClick: this.onComponentSelect, className: "action-item"}, this.props.component.label + " (" + this.props.component.id + ") "), 
            React.createElement(ActionIcon, {icon: "glyphicon-remove-sign", onClick: this.onComponentDelete})
          )
      );
  }
});

var ComponentTree = React.createClass({displayName: 'ComponentTree',
  mixins: [FluxMixin],
  
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
                    return (React.createElement(ComponentTreeItem, {index: index, component: component}));
                })
            )
        );
    }
    
    return (
        React.createElement("div", null, 
            React.createElement("div", null, 
                React.createElement(ActionIcon, {icon: "glyphicon-plus-sign", onClick: this.onComponentAdd}), 
                React.createElement(ActionIcon, {icon: "glyphicon-remove-circle", onClick: this.onClearComponents})
            ), 
            componentList
        )
    );
  }
});

var ComponentEdit = React.createClass({displayName: 'ComponentEdit',
  render: function() {
    if (this.props.component) {
        return (React.createElement("div", null, "Selected component " + this.props.component.label + " (" + this.props.component.id + ")"));
    } else {
        return null;
    }
  }
});

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
          React.createElement("div", null, 
          React.createElement(ComponentTree, {key: "true", components: this.state.components}), 
          React.createElement(ComponentEdit, {key: "edit", component: this.state.selectedComponent})
          ));
  }
});

React.render(React.createElement(FormBuilder, {flux: flux}), document.getElementById('app'));