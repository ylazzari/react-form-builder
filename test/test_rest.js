var rest = require('rest'),
    mime = require('rest/interceptor/mime'),
    stringify = require('json-stringify-safe');

module.exports = {

    setUp: function (callback) {
        this.client = rest.wrap(mime, {
            mime: 'application/json'
        });
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    test1: function (test) {
        var parent = {
            name: "p1"
        };
        
        var child = {
            name: "c1"
        }
        
        parent.child = child;
        child.parent = parent;
        
        var payload = stringify(parent, null, '\t');
        
        this.client({
            path: 'http://127.0.0.1:3000/data',
            method: 'POST',
            entity: payload
        }).then(function (response) {
            test.done();
        });
    }

};