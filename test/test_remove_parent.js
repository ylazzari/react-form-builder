var update = require('react/lib/update'),
    stringify = require('json-stringify-safe'),
    removeParent = require('../react_components/utils.js').removeParent,
    clone = require('clone');

function createChild(name, parent) {
    var child = {
        name: name,
        parent: parent,
        children: []
    };
    parent.children.push(child);
    return child;
}

function createParent(name) {
    var parent = {
        name: name,
        children: []
    };

    for (var i = 0; i < 3; i++) {
        var c = createChild('child' + (i + 1), parent);
        for (var j = 0; j < 3; j++) {
            var sc = createChild('sub child' + (j + 1), c);
        }
    }
    
    return parent;
}

module.exports = {

    setUp: function (callback) {
        callback();
    },

    tearDown: function (callback) {
        callback();
    },

    testRemoveParent: function (test) {
        var p1 = createParent('parent1');

        test.strictEqual(p1.children[0].parent, p1, 'Parent of children should be equal to parent');
        test.strictEqual(p1.children[0].children[0].parent, p1.children[0], 'Parent of grand-children should be equal to children');

        removeParent(p1);

        test.strictEqual(p1.children[0].parent, null, 'Parent of children should be  null');
        test.strictEqual(p1.children[0].children[0].parent, null, 'Parent of grand-children should be null');

        test.done();
    },

    testRemoveParent2: function (test) {
        var p = createParent('parent1');
        //var p1 = update(p, {name: {$set: 'toto'}});
        var p1 = clone(p);
        
        removeParent(p1);

        test.strictEqual(p.children[0].parent, p, 'Parent of children should be equal to parent');
        test.strictEqual(p.children[0].children[0].parent, p.children[0], 'Parent of grand-children should be equal to children');

        test.strictEqual(p1.children[0].parent, null, 'Parent of children should be  null');
        test.strictEqual(p1.children[0].children[0].parent, null, 'Parent of grand-children should be null');
        
        test.done();
    }

};