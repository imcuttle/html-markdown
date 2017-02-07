/**
 * Created by moyu on 2017/2/7.
 */
var isBrowser = (() => !(typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node !== 'undefined'))();
var jsdom = !isBrowser ? require('jsdom').jsdom : function (html) {
        var container = document.createElement('html');
        container.innerHTML = html;
        return container;
    };
var isHtml = require('./utils').isHtml;

// var __load__ = cheerio.load;

console.part = function (s) {
    !isBrowser && process.stdout.write(s);
}
/*var __text__ = cheerio.prototype.text*/
var jsdomText = function (dom) {
    var he = require('he'); // he for decoding html entities
    var html = dom.innerHTML;
    if(!html) {
        return dom.textContent;
    }

    var myhtml = html.replace(/<p.*?>(.*?)<\/p>/gmi, '$1\n')
        .replace(/<div.*?>(.*?)<\/div>/gmi, '$1\n')
        .replace(/<br.*?>/gmi, '\n')
        .replace(/<(?:.)*?>/gm, '') // remove all html tags
    var mytext = he.decode(myhtml)
    return mytext;
}

function elems2Markdown(domlist, parentTagName, inner, level, log) {
    inner = inner || false;
    level = level || 0;
    log = log || false;
    parentTagName = parentTagName || ""
    parentTagName = parentTagName.toLowerCase();
    var markdown = "";
    domlist.forEach(function (dom, index) {
        var part;
        if (dom.nodeType === 8) { // comment
            part = '';
        } else {
            var part = dom.nodeType === 3 ? dom.nodeValue : elem2Markdown(dom, parentTagName, index, inner, level);
            !inner && log && console.part(part);
        }
        markdown += part;
    })
    return markdown;
}

function elem2Markdown(dom, parentTagName, index, inner, level) {
    inner = inner || false;
    level = level || 0;
    index = index || 0;

    var tagName = dom.tagName || '';
    tagName = tagName.toLowerCase();
    var mapStr, children = dom.childNodes, existChild = children.length > 0;
    var childrenRender = function (level) {
        return existChild ? elems2Markdown.call(null, children, tagName, true, level) : dom.textContent;
    }
    if (/^h([\d]+)$/i.test(tagName)) {
        mapStr = `${'#'.repeat(+RegExp.$1)} ${childrenRender()}`;
    } else if ('ul' === tagName || 'ol' === tagName) {
        mapStr = `${childrenRender(level+(parentTagName === 'li'? 1 : 0))}`
    } else if ('li' === tagName) {
        mapStr = `${'   '.repeat(level)}${parentTagName === 'ul' ? '-' : 1+index+'.'} ${childrenRender()}`
    } else if ('img' === tagName) {
        mapStr = `![${dom.getAttribute('alt') || ''}](${dom.getAttribute('src')})`
    } else if ('p' === tagName) {
        mapStr = `${childrenRender()}  `
    } else if ('code' === tagName) {
        mapStr = "`" + childrenRender() + "`"
    } else if ('pre' === tagName) {
        mapStr = "\n```\n"+ `${jsdomText(dom).replace(/^\r?\n/, '').replace(/\r?\n$/, '')}\n` +"```\n"
    } else if ('a' === tagName) {
        mapStr = `[${childrenRender()}](${dom.getAttribute('href')})`;
    } else if ('div' === tagName) {
        mapStr = `${childrenRender()}`
    } else if ('strong' === tagName) {
        mapStr = `**${childrenRender()}**`
    } else if ('em' === tagName) {
        mapStr = `*${childrenRender()}*`
    } else if ('hr' === tagName) {
        mapStr = `------`
    } else if ('del' === tagName) {
        mapStr = `~~${childrenRender()}~~`
    } else if ('html' === tagName || 'body' === tagName) {
        mapStr = childrenRender()
    } else if ('head' === tagName) {
        mapStr = '';
    } else if ('br' === tagName) {
        mapStr = '  \n';
    } else {
        mapStr = dom.outerHTML;//+'\r\n'
    }
    return mapStr; // inner && 'li' !== tagName ? mapStr.replace(/\r\n/g, '')+'\r\n' : mapStr;
}

function fs_isDir(path) {
    var fs = require('fs');
    var stat = fs.statSync(path);
    return !!stat && stat.isDirectory();
}

function selectorMiddleware(dom, selector) {
    return selector ? dom.querySelector(selector) : dom;
}

function convertMiddleware(doc, log) {
    var tmp = elems2Markdown(doc.childNodes, doc.tagName || "document", undefined, undefined, log)+'\n';
    log && console.part('\n');
    return tmp.trim();
}

module.exports = {
    html2mdFromString: function (string, log) {
        var doc = jsdom(string);
        return convertMiddleware(doc, log)
    },
    html2mdFromURL: function (url, selector, log) {
        var urlObj = require('url').parse(url);
        protocol = urlObj.protocol.replace(/:$/, '');
        var protocolPackage = null;
        if (protocol === 'http' || protocol === 'https') {
            protocolPackage = require(protocol);
        } else {
            return Promise.reject("illegal protocol: " + protocol)
        }
        return new Promise( function (resolve, reject) {
            protocolPackage.get(url, function (res) {
                var statusCode = res.statusCode;
                if (statusCode === 302 || statusCode === 301) {
                    return html2mdFromURL(res.headers['location'])
                }
                res.setEncoding('utf-8');
                var html = "";
                res.on('data', function (string) {
                    html += string;
                }).on('end', function () {
                    resolve(jsdom(html));
                })
            })
        } ).then(function (dom) {
            return selectorMiddleware(dom, selector)
        }).then(function (dom) {
            return convertMiddleware(dom, log)
        })
    },

    html2mdFromPath: function (path, selector, log) {
        var fs = require('fs');
        var basename = require('path').basename(path);
        if (!fs.existsSync(path)) {
            return Promise.reject("not exists file: " + basename+'.');
        }
        if (fs_isDir(path)) {
            return Promise.reject(basename + " is a directory.");
        }

        return new Promise(function (resolve, reject) {
            fs.readFile(path, function (err, data) {
                if (err) {
                    reject(err.message);
                    return;
                }
                var string = data.toString();
                if (!isHtml(string)) {
                    reject(basename + " is not a html file.");
                    return;
                }
                resolve(jsdom(string))
            })
        }).then(function (dom) {
            return selectorMiddleware(dom, selector)
        }).then(function (dom) {
            return convertMiddleware(dom, log)
        })
    }
}
