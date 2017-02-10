/**
 * Created by moyu on 2017/2/7.
 */
var isBrowser = (() => !(typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node !== 'undefined'))();
var cheerio = require('cheerio');
var url = require('url');
var isHtml = require('./utils').isHtml;
var he = require('he');

var __load__ = cheerio.load;
cheerio.load = function (html) {
    arguments[0] = `<cheerio id="cheerio">${arguments[0]}</cheerio>`
    var $ = __load__(html, {
        decodeEntities: false
    });
    return $('cheerio#cheerio');
}
console.part = isBrowser ? function() {} : function (s) {process.stdout.write(s)};

var __text__ = cheerio.prototype.text
cheerio.prototype.text = function () {
    var html = this.html();
    if(!html) {
        return he.decode(__text__.call(this));
    }

    var myhtml = html.replace(/<p.*?>(.*?)<\/p>/gmi, '$1\n')
        .replace(/<div.*?>(.*?)<\/div>/gmi, '$1\n')
        .replace(/<br.*?>/gmi, '\n')
        .replace(/<(?:.)*?>/gm, '') // remove all html tags

    var mytext = he.decode(myhtml)
    return mytext;
}

function elems2Markdown(domlist, parentTagName, inner, level, log, baseUrl, head) {
    inner = inner || false;
    level = level || 0;
    log = log || false;
    parentTagName = parentTagName || ""
    parentTagName = parentTagName.toLowerCase();
    var markdown = "";
    domlist.each(function (index, dom) {
        var part;
        if (dom.type === 'comment') {
            part = '';
        } else {
            part = dom.type === 'text' ? cheerio(dom).text() : elem2Markdown(cheerio(dom), parentTagName, index, log, inner, level, baseUrl, head);
            !inner && log && console.part(part);
        }
        markdown += part;
    })
    return markdown;
}

function elem2Markdown(dom, parentTagName, index, log, inner, level, baseUrl, head) {
    inner = inner || false;
    level = level || 0;
    index = index || 0;
    head = head || '';
    var tagName = dom.prop('tagName') || '';
    tagName = tagName.toLowerCase();
    var mapStr='', children = dom.contents(), existChild = children.length > 0;
    var childrenRender = function (level, head) {
        return existChild ? elems2Markdown.call(null, children, tagName, true, level, log, baseUrl, head) : dom.text.call(dom);
    }
    if (/^h([\d]+)$/i.test(tagName)) {
        mapStr += `${head}${'#'.repeat(+RegExp.$1)} ${childrenRender()}`;
    } else if ('ul' === tagName || 'ol' === tagName) {
        mapStr += `${childrenRender(level+(parentTagName === 'li'? 1 : 0))}`
    } else if ('li' === tagName) {
        mapStr += `${head}${'   '.repeat(level)}${parentTagName === 'ul' ? '-' : 1+index+'.'} ${childrenRender()}`
    } else if ('img' === tagName) {
        mapStr += `![${dom.attr('alt') || ''}](${dom.attr('src') ? convertURL(baseUrl, dom.attr('src')).replace(/\)/g, '\\)') : ''})`
    } else if ('p' === tagName) {
        mapStr += `${head}${childrenRender()}  `
    } else if ('code' === tagName) {
        mapStr += "`" + childrenRender() + "`"
    } else if ('pre' === tagName) {
        mapStr = "\n```\n"+ `${dom.text().replace(/^\r?\n/, '').replace(/\r?\n$/, '')}\n` +"```\n"
    } else if ('a' === tagName) {
        mapStr += `[${childrenRender()}](${dom.attr('href') ? convertURL(baseUrl, dom.attr('href')).replace(/\)/g, "\\)") : ''})`;
    } else if ('div' === tagName) {
        mapStr += `${head}${childrenRender()}`
    } else if ('strong' === tagName) {
        mapStr += `**${childrenRender()}**`
    } else if ('em' === tagName) {
        mapStr += `*${childrenRender()}*`
    } else if ('hr' === tagName) {
        mapStr += `${head}------`
    } else if ('del' === tagName) {
        mapStr += `~~${childrenRender()}~~`
    } else if ('html' === tagName || 'body' === tagName) {
        mapStr += childrenRender()
    } else if ('head' === tagName) {
        mapStr += '';
    } else if ('blockquote' === tagName) {
        mapStr += `\n${head}> ${childrenRender(level, '> ')}\n`;
    } else if ('br' === tagName) {
        mapStr += `${head}  \n`;
    } else {
        mapStr += he.decode(dom.clone().wrap('<container />').parent().html());//+'\r\n'
    }
    return mapStr; // inner && 'li' !== tagName ? mapStr.replace(/\r\n/g, '')+'\r\n' : mapStr;
}
/**
 * Convert URL from any to absolute URL
 * @param baseUrl
 * @param href
 * @return url: String
 */
function convertURL (baseUrl, href) {
    // console.error(baseUrl, href);
    if (!baseUrl || href.startsWith('#')) return href;
    var opt = url.parse(baseUrl);
    if (!opt.slashes) return href;
    baseUrl = `${opt.protocol}//${opt.host}/`;

    var hopt = url.parse(href);
    if (hopt.slashes) return href;
    if (href.startsWith('//')) return `${opt.protocol}${href}`;

    href = href.startsWith('/') ? href.substr(1) : href;
    return `${baseUrl}${href}`;
}

function fs_isDir(path) {
    var fs = require('fs');
    var stat = fs.statSync(path);
    return !!stat && stat.isDirectory();
}

function selectorMiddleware($, selector) {
    return selector ? $.find(selector) : $;
}

function convertMiddleware($, log, baseUrl) {
    var tmp = elems2Markdown($.contents(), $.prop('tagName'), undefined, undefined, log, baseUrl)+'\n';
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
            return convertMiddleware($, log, url)
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
                resolve(cheerio.load(string))
            })
        }).then(function ($) {
            return selectorMiddleware($, selector)
        }).then(function ($) {
            return convertMiddleware($, log)
        })
    }
}

// module.exports.html2mdFromURL("https://www.npmjs.com/package/song-robot", "#readme").then(console.log)
// module.exports.html2mdFromPath("./test.html", "#readme").then(console.log)
// module.exports.html2mdFromString("<h1>是多少</h1><!--more-->", true)