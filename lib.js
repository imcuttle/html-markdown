/**
 * Created by moyu on 2017/2/7.
 */

var cheerio = require('cheerio');
var isHtml = require('cheerio/lib/utils').isHtml;

var __load__ = cheerio.load;
cheerio.load = function () {
    arguments[0] = `<cheerio id="cheerio">${arguments[0]}</cheerio>`
    var $ = __load__.apply(this, Array.from(arguments));
    return $('cheerio#cheerio');
}
console.part = function (s) {
    process.stdout.write(s);
}
var __text__ = cheerio.prototype.text
cheerio.prototype.text = function () {
    var he = require('he'); // he for decoding html entities
    var html = this.html();
    if(!html) {
        return __text__.call(this);
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
    domlist.each(function (index, dom) {
        var part = dom.type === 'text' ? cheerio(dom).text() : elem2Markdown(cheerio(dom), parentTagName, index, inner, level);
        !inner && log && console.part(part);
        markdown += part;
    })
    return markdown;
}

function elem2Markdown(dom, parentTagName, index, inner, level) {
    inner = inner || false;
    level = level || 0;
    index = index || 0;
    var tagName = dom.prop('tagName') || '';
    tagName = tagName.toLowerCase();
    var mapStr, children = dom.contents(), existChild = children.length > 0;
    var childrenRender = function (level) {
        return existChild ? elems2Markdown.call(null, children, tagName, true, level) : dom.text.call(dom);
    }
    if (/^h([\d]+)$/i.test(tagName)) {
        mapStr = `${'#'.repeat(+RegExp.$1)} ${childrenRender()}`;
    } else if ('ul' === tagName || 'ol' === tagName) {
        mapStr = `${childrenRender(level+(parentTagName === 'li'? 1 : 0))}`
    } else if ('li' === tagName) {
        mapStr = `${'   '.repeat(level)}${parentTagName === 'ul' ? '-' : 1+index+'.'} ${childrenRender()}`
    } else if ('img' === tagName) {
        mapStr = `![${dom.attr('alt') || ''}](${dom.attr('src')})`
    } else if ('p' === tagName) {
        mapStr = `${childrenRender()}  `
    } else if ('code' === tagName) {
        mapStr = "`" + childrenRender() + "`"
    } else if ('pre' === tagName) {
        mapStr = "\n```\n"+ `${dom.text().replace(/^\r?\n/, '').replace(/\r?\n$/, '')}\n` +"```\n"
    } else if ('a' === tagName) {
        mapStr = `[${childrenRender()}](${dom.attr('href')})`;
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
    } else {
        mapStr = dom.clone().wrap('<container />').parent().html();//+'\r\n'
    }
    return mapStr; // inner && 'li' !== tagName ? mapStr.replace(/\r\n/g, '')+'\r\n' : mapStr;
}

function fs_isDir(path) {
    var fs = require('fs');
    var stat = fs.statSync(path);
    return !!stat && stat.isDirectory();
}

function selectorMiddleware($, selector) {
    return selector ? $.find(selector) : $;
}

function convertMiddleware($, log) {
    var tmp = elems2Markdown($.contents(), $.prop('tagName'), undefined, undefined, log)+'\n';
    log && console.part('\n');
    return tmp.trim();
}

module.exports = {
    html2mdFromString: function (string, log) {
        var $ = cheerio.load(string);
        return convertMiddleware($, log)
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
                    var cheerio = require('cheerio');
                    resolve(cheerio.load(html));
                })
            })
        } ).then(function ($) {
            return selectorMiddleware($, selector)
        }).then(function ($) {
            return convertMiddleware($, log)
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

        var string = fs.readFileSync(path).toString();
        if (!isHtml(string)) {
            return Promise.reject(basename + " is not a html file.");
        }
        return Promise.resolve(cheerio.load(string))
            .then(function ($) {
                return selectorMiddleware($, selector)
            }).then(function ($) {
                return convertMiddleware($, log)
            })
    }

}


