/** @jsx React.DOM */

var React = require("react");
var DragDropMixin = require("react-dnd").DragDropMixin;
var DraggableTypes = require("./draggableTypes.js");

var ComponentToolbarItem = React.createClass({
    mixins: [DragDropMixin],
    
    configureDragDrop: function(registerType) {
        registerType(DraggableTypes.TOOLBAR_ITEM, {
            dragSource: {
                beginDrag: function() {
                    return {
                        item: this.props.item
                    };
                }
            }
        });
    },
    
    render2: function() {
        return (<span className={"fa " + this.props.item.icon} {...this.dragSourceFor(DraggableTypes.TOOLBAR_ITEM)}></span>);
    },
    
    render: function() {
        return (<li {...this.dragSourceFor(DraggableTypes.TOOLBAR_ITEM)}><span className={"fa " + this.props.item.icon}></span>{this.props.item.name}</li>);
    }
});

module.exports = ComponentToolbarItem;