/** @jsx React.DOM */

var React = require("react");

var ActionIcon = React.createClass({
  render: function() {
    return (<span onClick={this.props.onClick} className={"glyphicon " + this.props.icon + " action-item"}></span>);
  }
});

module.exports = ActionIcon;