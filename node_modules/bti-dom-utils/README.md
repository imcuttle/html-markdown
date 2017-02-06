# DOM Utilities

This is a small collection of DOM utilities that are used frequently at Beneath the Ink. While some of the methods are similar to jQuery, this library is more focused on text in the DOM and extracting partial content from large documents.

## Installation & Basic Usage

Download the latest version from the [release page](https://github.com/BeneathTheInk/dom-utils/releases) and use via a script tag. The variable `DOMUtils` will be attached to `window`.

```html
<script type="text/javascript" src="dom-utils.js"></script>
```

If using Browserify, you can install via NPM and use with `require("bti-dom-utils")`.

```bash
$ npm install bti-dom-utils
```

This library is just a plain object with several methods on it. Here is quick example of usage.

```javascript
DOMUtils.contains(document, document.body); // true
```

## Documentation

For quick documentation on each function, please see the inline comments in the source code. These comments are in [Doxxo](https://github.com/BeneathTheInk/doxxo) format, so you can also build them for a prettier experience.

```bash
npm run build-docs
```

## How to Build from Scratch

The DOM utils uses Grunt to build a browserify bundle of the original source found in `lib/`. When the command below completes, the compiled source will be saved to `dist/` directory.

```bash
npm install && grunt
```

If you don't the Grunt cli tools installed globally, run `npm install -g grunt-cli` before running that command.

## Running the Unit Tests

While still in desperate need of more tests, there are a few Mocha-powered unit tests in the `test/` directory. Running the tests is very simple. Make sure there is freshly built copy of the library in the `dist/` folder and then open `test/index.html` in any browser.