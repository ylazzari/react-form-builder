/** @jsx React.DOM */

var React = require("react");

var ComponentEdit = React.createClass({
  render: function() {
    if (this.props.component) {
        return (<div>{"Selected component " + this.props.component.label + " (" + this.props.component.id + ")"}</div>);
    } else {
        return null;
    }
  }
});

module.exports = ComponentEdit;