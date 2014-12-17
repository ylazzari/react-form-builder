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
    clone = require('clone'),
    constants = require('./storeEvents.js');

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
    
    this.componentStoreOnChange.throttle(1000).subscribe(function(eventParams) {
    
        console.log(eventParams.type);
    
        var components = this.getFlux().store("ComponentStore").getState().components
        
        Rx.Observable.fromArray(components).map(function(c) {
            return clone(c);
        }).map(function(c) {
            removeParent(c);
            return c;
        }).toArray().subscribe(function(componentsClone) {
            this.restClient({
                path: this.props.serverPostBack,
                method: 'POST',
                entity: componentsClone
            }).then(function(response) {
                $(this.refs.previewPanel.getDOMNode()).html(response.entity);
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
        <div className="form-builder">
            <ComponentToolbar items={this.state.definitions} />
            <div className="clearfix">          
                <ComponentTree key="tree" components={this.state.components} selected={this.state.selectedComponent} />
                <ComponentEdit key="edit" component={this.state.selectedComponent} />
            </div>
          <div>
            <pre ref="previewPanel"></pre>
          </div>
        </div>
          );
  }
});

module.exports = FormBuilder;