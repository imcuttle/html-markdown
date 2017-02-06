# Special Entities

A small JavaScript library for normalizing the encoding of HTML entities.

## Install

Download the latest version from our [release page](https://github.com/BeneathTheInk/special-entities/releases) and use via a script tag. The variable `Entities` will be attached to `window`.

```html
<script type="text/javascript" src="special-entities.js"></script>
```

If using Browserify or Node.js, you can install via NPM and use via `require("special-entities")`.

```shell
$ npm install special-entities
```

## Usage

This library exposes an object, `Entities`, with the following methods:

### convert()

```
Entities.convert( val [, format ] )
```

Takes any single value, `val`, and returns it in the specified `format` or `null` if the value cannot be converted. `val` can be any single UTF-8 character, a valid HTML entity (ie. `&amp;` or `&#x26;`), or an integer representing a Unicode code point. `format` can be any of the following values:

* __`numeric`__ - A numeric character reference. Ex. `&#38;`, `&#169;`
* __`hex`__ - A hexadecimal character reference. Ex. `&#x26;`, `&#xA9;`
* __`name`__ - A named character reference (aka a special entity). Ex. `&amp;`, `&copy;`.
* __`utf-8`__ - A single utf-8 character. Ex. `&`, `©`
* __`code`__ - A Unicode code point. Ex. `38`, `169`
* __`html`__ - First looks for the named reference equivalent, otherwise returns a numeric reference. Basically a combo of `name` and `xml`. This is the default format.

### normalizeXML()

```
Entities.normalizeXML( str [, format ] )
```

Takes, `str`, a string of xml (ie. html and xhtml) and converts all HTML entities and non-ASCII characters into the specified `format`. See above for valid formats. The default format is `html`.

### normalizeEntities()

```
Entities.normalizeEntities( str [, format ] )
```

Takes, `str`, a string and converts all HTML entities into the specified `format`. See above for valid formats. The default format is `html`.

### toCharCode()

```
Entities.toCharCode( val )
```

Takes any single value, `val`, and returns an integer representing the Unicode code point. Valid values for `val` are the same as specified in `.convert()`.

### toEntity()

```
Entities.toEntity( nameOrCode [, asHex ] )
```

Takes a code point or a special entity name and returns a formatted HTML entity. If passing a code point for the first argument, pass `true` for `asHex` to return the entity as a hex value instead of an integer value.

### codeToName() / nameToCode()

```
Entities.codeToName( code )
Entities.nameToCode( name )
```

These methods help to convert between a special entity name and a unicode code point. Names should not include the HTML entity formatting (eg. just `"copy"`, not `"&copy;"`).

