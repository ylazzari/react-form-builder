/** @jsx React.DOM */

var React = require("react");

var ComponentEdit = React.createClass({
  
  onComponentChange: function(event) {
  },

  render: function() {
    if (this.props.component) {
        return (
        <div className="component-edit">        
        {React.createElement(this.props.component.definition.editClass, {
            component: this.props.component
        })}
        </div>
        );
    } else {
        return null;
    }
  }
});

module.exports = ComponentEdit;