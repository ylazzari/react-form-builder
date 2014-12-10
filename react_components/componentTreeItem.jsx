/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentTreeItem = React.createClass({
    mixins: [FluxMixin, DragDropMixin],
  
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition) {
                    this.getFlux().actions.addComponent(definition, this.props.index);
                }
            }
        });
    },
  
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
    var dropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var liClasses = dropState.isDragging && dropState.isHovering ? 'drag-hovering' : '';
    return (
          <li data-component-index={this.props.index} {...this.dropTargetFor(DraggableTypes.TOOLBAR_ITEM)} className={liClasses}>
            <span className={"fa " + this.props.component.definition.icon}></span>
            <span onClick={this.onComponentSelect} className="action-item">{this.props.component.label}</span>
            <ActionIcon icon="fa-trash" onClick={this.onComponentDelete} />
          </li>
      );
  }
});

module.exports = ComponentTreeItem;