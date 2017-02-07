# html-markdown

Convert from Html to Markdown isomorphically By Javascript.

Branches: master => cheerio;  jsdom => jsdom (isomorphic);

Requirements: [Cheerio](https://github.com/cheeriojs/cheerio) Or [jsDom](https://github.com/tmpvar/jsdom)
Cheerio is HTML parser using like jquery for server.
jsDom is has better performance on browser, don't need import jsdom.
So we can `html-markdown` browser and server(nodejs), that is to say, it's **isomorphic**.

**jsdom version in npm.**

- Bash

```bash
npm i -g html-markdown
html2md -h
html2md https://www.npmjs.com/package/html-markdown -s "#readme" > html-markdown-readme.md
# with image
html2md https://www.npmjs.com/package/song-robot -s "#readme" > song-robot-readme.md
html2md https://www.npmjs.com/package/moka-cli -s "#readme" > moka-cli-readme.md

html2md path/to/html/file -s "#markdown"

html2md --eval "<h1>Hello!</h1>"
```

- Script

```
npm i --save html-markdown
```

```javascript
var html2md = require('html-markdown');

var md1 = html2md.html2mdFromString("<h1>Hello!</h1>");
// https or http
html2md.html2mdFromURL("https://www.npmjs.com/package/song-robot", "#readme").then(console.log);

html2md.html2mdFromPath("path/to/html/file", "#markdown").then(console.log);
```