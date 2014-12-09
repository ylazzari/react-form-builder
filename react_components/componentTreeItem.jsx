/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");

var ComponentTreeItem = React.createClass({
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
          <li data-component-index={this.props.index}>
            <span onClick={this.onComponentSelect} className="action-item">{this.props.component.label + " (" + this.props.component.id + ") "}</span>
            <ActionIcon icon="glyphicon-remove-sign" onClick={this.onComponentDelete} />
          </li>
      );
  }
});

module.exports = ComponentTreeItem;