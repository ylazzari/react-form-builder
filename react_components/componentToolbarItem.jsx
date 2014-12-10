/** @jsx React.DOM */

var React = require("react");

var ComponentToolbarItem = React.createClass({
    render: function() {
        return (<span className={"fa " + this.props.item.icon}></span>);
    }
});

module.exports = ComponentToolbarItem;