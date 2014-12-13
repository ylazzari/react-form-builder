var stringify = require('json-stringify-safe'),
    convert = require('data2xml')();

module.exports = {

    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testJsonToXml: function (test) {
        debugger;

        var xml = convert(
            'TopLevelElement', {
                _attr: {
                    xmlns: 'http://chilts.org/xml/namespace'
                },
                SimpleElement: 'A simple element',
                ComplexElement: {
                    A: 'Value A',
                    B: 'Value B',
                },
                DataSources: {
                    DataSource: [
                        {
                            _attr: {
                                a: 'a',
                                b: 'b'
                            }
                    },
                        {
                            _attr: {
                                a: '1',
                                b: '2'
                            }
                    }
                ]
                }
            }
        );

        console.log(xml);

        test.done();
    }

};