/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var EventHandler = require('rx-react').EventHandler;
var Rx = require('rx');

var SectionEdit = React.createClass({
    mixins: [FluxMixin],
    
    componentWillMount: function() {
        this.onLabelChangeRx = EventHandler.create();
        this.onLabelChangeRx.map(function(event) {
            return event.target.value;
        })
        .throttle(250)
        .subscribe(function(value) {
            this.props.component.label = value;
            this.getFlux().actions.updateSelectedComponent(this.props.component);
        }.bind(this));
    },
    
    onLabelChange: function(event) {
        this.props.component.label = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },
    
    onSubmit: function(event) {
        event.preventDefault();
    },

    render: function() {
        return (
            <div>
            {/*<h4><span className={"fa " + this.props.component.definition.icon}></span>{this.props.component.label}</h4>*/}
                <form className="form-horizontal" role="form" onSubmit={this.onSubmit}>
                    <div className="form-group">
                        <label className="control-label col-sm-2" htmlFor="labelInput">Label</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="labelInput" value={this.props.component.label} onChange={this.onLabelChange}></input>
                        </div>
                    </div>
                </form>
            </div>
            );    
    }
});

module.exports = SectionEdit;