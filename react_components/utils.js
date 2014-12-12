module.exports = {
    ellipsis: function (str, length) {
        if (str && str.length > length) {
            return str.substring(0, length) + "...";
        }
        return str;
    },

    removeParent: function (parent) {
        var removeParentInner = function myself(parent) {
            if (parent.children) {
                parent.children.forEach(function (child) {
                    child.parent = null;
                    myself(child);
                });
            }
        };
        removeParentInner(parent);
    }
}