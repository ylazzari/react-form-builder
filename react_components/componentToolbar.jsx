/** @jsx React.DOM */

var React = require("react");
var ComponentToolbarItem = require("./componentToolbarItem.jsx");

var ComponentToolbar = React.createClass({
    getInitialState: function() {
        var items = [];
        for (var i = 0; i < 100; i++) {
            var item = {
                icon: "fa-check",
                elementName: ""
            };
            items.push(item);
        }
        return {
            items: items
        };
    },
    
    render: function() {
        return (
        <div className="component-toolbar container-fluid">
        {this.state.items.map(function(item) {
            return (<ComponentToolbarItem item={item} />);
        }.bind(this))}
        </div>
        );
    }
});

module.exports = ComponentToolbar;