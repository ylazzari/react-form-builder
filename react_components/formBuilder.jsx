/** @jsx React.DOM */

var React = require("react");
var Fluxxor = require("fluxxor");
var FluxMixin = Fluxxor.FluxMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;

var ComponentTree = require("./componentTree.jsx");
var ComponentEdit = require("./componentEdit.jsx");
var ComponentToolbar = require("./componentToolbar.jsx");

var FormBuilder = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("ComponentStore")],
  
  getInitialState: function() {
    return {};
  },
  
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return flux.store("ComponentStore").getState();
  },
  
  render: function() {
      return (
          <div className="form-builder row">
            <div className="col-md-4"><ComponentToolbar /></div>
            <div className="col-md-4"><ComponentTree key="true" components={this.state.components} /></div>
            <div className="col-md-4"><ComponentEdit key="edit" component={this.state.selectedComponent} /></div>
          </div>);
  }
});

module.exports = FormBuilder;