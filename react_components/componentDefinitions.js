var React = require('react');
var SectionEdit = require('./sectionEdit.jsx');
var QuestionEdit = require('./questionEdit.jsx');

module.exports = [
    {
        icon: "fa-list-alt",
        name: "Section",
        componentClass: "",
        initializeComponent: function(component) {
        },
        editClass: SectionEdit,
        componentType: "section",
    },
    {
        icon: "fa-question-circle",
        name: "Question",
        componentClass: "",
        initializeComponent: function(component) {
            component.questionType = "textbox";
        },
        editClass: QuestionEdit,
        componentType: "question",
        questionTypes: 
        [
            {
                value: "textbox",
                text: "Textbox"
            },
            {
                value: "textarea",
                text: "Text Area"
            },
            {
                value: "checkbox",
                text: "Checkbox"
            },
            {
                value: "select",
                text: "Dropdown"
            },
            {
                value: "radio",
                text: "Radio Button"
            }
        ]
    }
];