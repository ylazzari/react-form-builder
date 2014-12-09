/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var ComponentTreeItem = require("./componentTreeItem.jsx");

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

module.exports = ComponentTree;