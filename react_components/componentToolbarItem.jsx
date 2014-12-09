/** @jsx React.DOM */

var React = require("react");

var ComponentToolbarItem = React.createClass({
    render: function() {
        return (<div className={"fa " + this.props.item.icon}></div>);
    }
});

module.exports = ComponentToolbarItem;