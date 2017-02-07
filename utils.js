/**
 * Created by moyu on 2017/2/7.
 */
/*
 * A simple way to check for HTML strings or ID strings
 */

var quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/;

/*
 * Check if string is HTML
 */
exports.isHtml = function(str) {
    // Faster than running regex, if str starts with `<` and ends with `>`, assume it's HTML
    if (str.charAt(0) === '<' && str.charAt(str.length - 1) === '>' && str.length >= 3) return true;

    // Run the regex
    var match = quickExpr.exec(str);
    return !!(match && match[1]);
};
