//var $ = require("jquery");
//var Boostrap = require("bootstrap");
var React = require("react");
var Fluxxor = require("fluxxor");
var DragDropMixin = require('react-dnd').DragDropMixin;

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

var ActionIcon = React.createClass({
  render: function() {
    return (<span onClick={this.props.onClick} className={"glyphicon " + this.props.icon + " action-item"}></span>);
  }
});

var ComponentTreeItem = React.createClass({
  mixins: [FluxMixin, DragDropMixin],
  
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
          <li data-component-index={this.props.index}>
            <span onClick={this.onComponentSelect} className="action-item">{this.props.component.label + " (" + this.props.component.id + ") "}</span>
            <ActionIcon icon="glyphicon-remove-sign" onClick={this.onComponentDelete} />
          </li>
      );
  }
});

var ComponentTree = React.createClass({
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
            <ul>
                {this.props.components.map(function(component, index) {
                    return (<ComponentTreeItem index={index} component={component} />);
                })}
            </ul>
        );
    }
    
    return (
        <div>
            <div>
                <ActionIcon icon="glyphicon-plus-sign" onClick={this.onComponentAdd} />
                <ActionIcon icon="glyphicon-remove-circle" onClick={this.onClearComponents} />
            </div>
            {componentList}
        </div>
    );
  }
});

var ComponentEdit = React.createClass({
  render: function() {
    if (this.props.component) {
        return (<div>{"Selected component " + this.props.component.label + " (" + this.props.component.id + ")"}</div>);
    } else {
        return null;
    }
  }
});

var FormBuilder = React.createClass({
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
          <div>
          <ComponentTree key="true" components={this.state.components} />
          <ComponentEdit key="edit" component={this.state.selectedComponent} />
          </div>);
  }
});

React.render(<FormBuilder flux={flux} />, document.getElementById('app'));