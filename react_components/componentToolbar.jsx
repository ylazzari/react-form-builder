/** @jsx React.DOM */

var React = require("react");
var ComponentToolbarItem = require("./componentToolbarItem.jsx");

var ComponentToolbar = React.createClass({
    render: function() {
        return (
        <div className="component-toolbar container-fluid">
        {this.props.items.map(function(item) {
            return (<ComponentToolbarItem key={item.name} item={item} />);
        }.bind(this))}
        </div>
        );
    }
});

module.exports = ComponentToolbar;