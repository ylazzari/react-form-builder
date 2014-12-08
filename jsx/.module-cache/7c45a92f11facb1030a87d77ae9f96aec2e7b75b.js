var constants = {
  ADD_COMPONENT: "ADD_COMPONENT",
  DELETE_COMPONENT: "DELETE_COMPONENT",
  CLEAR_COMPONENTS: "CLEAR_COMPONENTS",
  SELECT_COMPONENT: "SELECT_COMPONENT"
};


var FormBuilderClass = React.createClass({displayName: 'FormBuilderClass',
  
  getInitialState: function() {
    return {};
  },
  
  render: function() {
    return (
        React.createElement("div", null, 
            "Hello world!"
        )
    );
  }
});
var FormBuilder = React.createFactory(FormBuilderClass);

React.render(FormBuilder({flux: flux}), document.getElementById('app'));