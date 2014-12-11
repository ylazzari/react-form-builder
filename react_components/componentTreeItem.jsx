/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var ActionIcon = require("./actionIcon.jsx");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");
var ellipsis = require('./utils.js').ellipsis;

var ComponentTreeItem = React.createClass({
    mixins: [FluxMixin, DragDropMixin],
    
    getInitialProps: function() {
        return {
            supportDnd: false
        };
    },
  
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dropTarget: {
                acceptDrop: function(definition, event, isHandled, effect) {
                    if ($(event.target).hasClass("add-child")) {
                        this.getFlux().actions.addChildComponent(definition, this.props.component);
                    } else {
                        this.getFlux().actions.addComponent(definition, this.props.component);
                    }
                }
            }
        });
        
        registerType(DraggableTypes.TREE_ITEM, {
            dragSource: {
                beginDrag: function() {
                    return {
                        item: this.props.component
                    };
                }
            },
            
            dropTarget: {
                acceptDrop: function(component, event, isHandled, effect) {
                },                
                over: function(component, event) {
                    this.getFlux().actions.moveComponent(this.props.component, component);
                },
                enter: function(component, event) {
                },
                leave: function(component, event) {
                }
            }
        });
    },
  
  onComponentSelect: function(event) {
    this.getFlux().actions.selectComponent(this.props.component);
  },
  
  onComponentDelete: function(event) {
    this.getFlux().actions.deleteComponent(this.props.component);
  },
  
  ellipsis: function(str) {
    return str;
  },
  
  renderDnd: function() {
    var toolbarItemDropState = this.getDropState(DraggableTypes.TOOLBAR_ITEM);
    var treeItemDropState = this.getDropState(DraggableTypes.TREE_ITEM);
    var liClasses;
    if (toolbarItemDropState.isHovering) {
        liClasses += ' drag-hovering';
    } else {
        var dragState = this.getDragState(DraggableTypes.TREE_ITEM);
        if (dragState.isDragging) {
            liClasses += ' dragging';
        }
    }
    
    var children;
    if (React.Children.count(this.props.children) > 0) {
        children = (<ul>{this.props.children}</ul>);
    }
    
    return (
          <li className={liClasses} {...this.dragSourceFor(DraggableTypes.TREE_ITEM)} {...this.dropTargetFor(DraggableTypes.TREE_ITEM, DraggableTypes.TOOLBAR_ITEM)}>
            <span className={"fa " + this.props.component.definition.icon}></span>
            <span onClick={this.onComponentSelect} className="action-item">{ellipsis(this.props.component.label, 20)}</span>
            <ActionIcon icon="fa-trash" onClick={this.onComponentDelete} />
            <span className="add-child fa fa-indent"></span>
            {children}
          </li>
      );
  },
  
  renderNonDnd: function() {
    return (
          <li>
            <span className={"fa " + this.props.component.definition.icon}></span>
            <span onClick={this.onComponentSelect} className="action-item">{ellipsis(this.props.component.label, 20)}</span>
            <ActionIcon icon="fa-trash" onClick={this.onComponentDelete} />
          </li>
          );
  },
  
  render: function() {
    if (this.props.supportDnd) {
        return this.renderDnd();
    }
    return this.renderNonDnd();
  }
});

module.exports = ComponentTreeItem;