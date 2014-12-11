/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);

var QuestionEdit = React.createClass({
    mixins: [FluxMixin],

    onLabelChange: function(event) {
        this.props.component.label = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },

    onQuestionTypeChange: function(event) {
        this.props.component.questionType = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },
    
    onListOfValuesChange: function(event) {
        this.props.component.listOfValues = event.target.value;
        this.getFlux().actions.updateSelectedComponent(this.props.component);
    },
    
    renderListOfValues: function() {
        if (this.props.component.questionType == "radio" || this.props.component.questionType == "select") {
            return (
                <div className="form-group">
                    <label className="control-label col-sm-2" htmlFor="listOfValuesInput">List of values</label>
                    <div className="col-sm-10">
                        <textarea className="form-control" value={this.props.component.listOfValues} onChange={this.onListOfValuesChange} rows="5"></textarea>
                    </div>
                </div>            
            );
        }
        return null;
    },

    render: function() {
        return (
            <div>
                <h4><span className={"fa " + this.props.component.definition.icon}></span>{this.props.component.label}</h4>
                <form role="form" className="form-horizontal">
                    <div className="form-group">
                        <label className="control-label col-sm-2" htmlFor="labelInput">Label</label>
                        <div className="col-sm-10">
                            <input type="text" className="form-control" id="labelInput" value={this.props.component.label} onChange={this.onLabelChange}></input>
                        </div>
                    </div>                    
                    <div className="form-group">
                        <label className="control-label col-sm-2" htmlFor="questionTypeInput">Type</label>
                        <div className="col-sm-10">
                            <select className="form-control" id="questionTypeInput" value={this.props.component.questionType} onChange={this.onQuestionTypeChange}>
                            {this.props.component.definition.questionTypes.map(function(questionType) {
                                return (<option key={questionType.value} value={questionType.value}>{questionType.text}</option>);
                            })}
                            </select>
                        </div>
                    </div>
                    {this.renderListOfValues()}                    
                </form>
            </div>
            );     
    }
});

module.exports = QuestionEdit;