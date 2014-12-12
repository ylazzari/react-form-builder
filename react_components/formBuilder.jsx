/** @jsx React.DOM */

var React = require("react"),
    Fluxxor = require("fluxxor"),
    FluxMixin = Fluxxor.FluxMixin(React),
    StoreWatchMixin = Fluxxor.StoreWatchMixin,
    rest = require('rest'),
    mime = require('rest/interceptor/mime'),
    ComponentTree = require("./componentTree.jsx"),
    ComponentEdit = require("./componentEdit.jsx"),
    ComponentToolbar = require("./componentToolbar.jsx"),
    EventHandler = require('rx-react').EventHandler,
    Rx = require('rx'),
    stringify = require('json-stringify-safe'),
    removeParent = require('./utils.js').removeParent,
    clone = require('clone');

var FormBuilder = React.createClass({
  mixins: [FluxMixin, StoreWatchMixin("ComponentStore")],
  
  getInitialState: function() {
    return {};
  },
  
  getStateFromFlux: function() {
    var flux = this.getFlux();
    return flux.store("ComponentStore").getState();
  },
    
  
  componentWillMount: function() {
    this.restClient = rest.wrap(mime, {mime: 'application/json'});
    
    var componentStore = this.getFlux().store("ComponentStore");
    
    this.componentStoreOnChange = EventHandler.create();
    
    this.componentStoreOnChange.throttle(1000).subscribe(function() {
    
        var components = this.getFlux().store("ComponentStore").getState().components
        /*
        var componentsClone = components.map(function(c) {
            return clone(c);
        }).map(function(c) {
            removeParent(c);
            return c;
        });
        
        this.restClient({
            path: 'http://127.0.0.1:3000/data',
            method: 'POST',
            entity: componentsClone
        }).then(function(response) {
            this.refs.previewPanel.getDOMNode().innerHTML = response.entity;
        }.bind(this));
        */
        
        Rx.Observable.fromArray(components).map(function(c) {
            return clone(c);
        }).map(function(c) {
            removeParent(c);
            return c;
        }).toArray().subscribe(function(componentsClone) {
            this.restClient({
                path: 'http://127.0.0.1:3000/data',
                method: 'POST',
                entity: componentsClone
            }).then(function(response) {
                this.refs.previewPanel.getDOMNode().innerHTML = response.entity;
            }.bind(this));
        }.bind(this));
        
        
    }.bind(this));
    
    componentStore.addListener("change", this.componentStoreOnChange);    
  },
  
  componentWillUnmount : function() {
    var flux = this.getFlux();    
    flux.store("ComponentStore").removeListener("change", this.componentStoreOnChange);
  },
  
  render: function() {
      return (
        <div className="container form-builder">
          <div className="row">          
            <div className="col-md-2"><ComponentToolbar items={this.state.definitions} /></div>
            <div className="col-md-4"><ComponentTree key="true" components={this.state.components} /></div>
            <div className="col-md-6"><ComponentEdit key="edit" component={this.state.selectedComponent} /></div>
          </div>
          <div>
            <textarea ref="previewPanel" rows="50" cols="50"></textarea>
          </div>
        </div>
          );
  }
});

module.exports = FormBuilder;