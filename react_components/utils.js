module.exports = {
    ellipsis: function(str, length) {
        if (str && str.length > length) {
            return str.substring(0, length) + "...";
        }
        return str;
    }
}