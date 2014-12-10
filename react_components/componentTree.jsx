/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var ComponentTreeItem = require("./componentTreeItem.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentTree = React.createClass({
    mixins: [FluxMixin, DragDropMixin],

    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition) {
                    this.getFlux().actions.addComponent(definition);
                }
            }
        });
    },
  
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
                    return (<ComponentTreeItem key={component.id} index={index} component={component} />);
                })}
            </ul>
        );
    }
    
    var dropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var dropStateClass = dropState.isDragging && dropState.isHovering ? 'drag-hovering' : '';

    return (
        <div className={"component-tree " + dropStateClass}>
            <div {...this.dropTargetFor(DraggableTypes.TOOLBAR_ITEM)}>
                <ActionIcon icon="fa-trash" onClick={this.onClearComponents} />
            </div>
            {componentList}
        </div>
    );
  }
});

module.exports = ComponentTree;