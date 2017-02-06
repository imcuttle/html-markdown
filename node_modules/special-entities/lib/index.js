// the raw mapping of special names to unicode values
var by_name =
exports.by_name = require("../data/entities.json");

// index the reverse mappings immediately
var by_code = exports.by_code = {};
Object.keys(by_name).forEach(function(n) {
	by_name[n].forEach(function(c) {
		if (by_code[c] == null) by_code[c] = [];
		by_code[c].push(n);
	});
});

// a few regular expressions for parsing entities
var hex_value_regex = /^0?x([a-f0-9]+)$/i,
	entity_regex = /&(?:#x[a-f0-9]+|#[0-9]+|[a-z0-9]+);?/ig,
	dec_entity_regex = /^&#([0-9]+);?$/i,
	hex_entity_regex = /^&#x([a-f0-9]+);?$/i,
	spec_entity_regex = /^&([a-z0-9]+);?$/i;

// converts all entities found in string to specific format
var normalizeEntities =
exports.normalizeEntities = function(str, format) {
	return str.replace(entity_regex, function(entity) {
		return convert(entity, format) || entity;
	});
}

// converts all entities and higher order utf-8 chars to format
exports.normalizeXML = function(str, format) {
	var i, code, res;
	
	// convert entities first
	str = normalizeEntities(str, format);

	// find all characters above ASCII and replace, backwards
	for (i = str.length - 1; i >= 0; i--) {
		code = str.charCodeAt(i);
		if (code > 127) {
			res = convert(str[i], format);
			str = str.substr(0, i) + (res != null ? res : str[i]) + str.substr(i + 1);
		}
	}

	return str;
}

// converts single value into utf-8 character or entity equivalent
var convert =
exports.convert = function(s, format) {
	var code, name;
	if (format == null) format = "html";

	code = toCharCode(s);
	if (code === false) return null;

	switch(format) {
		// only decimal entities
		case "xml":
		case "xhtml":
		case "num":
		case "numeric":
			return toEntity(code);

		// only hex entities
		case "hex":
			return toEntity(code, true);

		// first special, then decimal
		case "html":
			return toEntity((name = cton(code)) != null ? name : code);

		// only special entities
		case "name":
		case "special":
			return (name = cton(code)) != null ? toEntity(name) : null;

		// utf-8 character
		case "char":
		case "character":
		case "utf-8":
		case "UTF-8":
			return String.fromCharCode(code);

		// regular number
		case "code":
			return code;
	}

	return null;
}

// code to name
var cton =
exports.codeToName = function(c) {
	var n = by_code[c.toString()];
	return n != null ? n[0] : null;
}

// name to code
var ntoc =
exports.nameToCode = function(n) {
	var c = by_name[n]
	return c != null ? c[0] : null;
}

// parse an array of inputs and returns the equivalent
// unicode decimal or false if invalid
var toCharCode =
exports.toCharCode = function(s) {
	var m, code;

	if (typeof s === "string") {
		if (s === "") return false;

		// regular char
		if (s.length === 1) return s.charCodeAt(0);

		// special entity
		if (m = spec_entity_regex.exec(s)) {
			return ntoc(m[1]) || false;
		}

		// decimal entity
		if (m = dec_entity_regex.exec(s)) {
			return parseInt(m[1], 10);
		}

		// hex entity
		if (m = hex_entity_regex.exec(s)) {
			return parseInt(m[1], 16);
		}

		// hex value
		if (m = hex_value_regex.exec(s)) {
			return parseInt(m[1], 16);
		}

		// otherwise look it up as a special entity name
		return ntoc(s) || false;
	}

	if (typeof s === "number") return s;

	return false;
}

// converts string or number to valid entity
var toEntity =
exports.toEntity = function(n, hex) {
	return "&" + (
		typeof n === "number" ?
		"#" + (hex ? "x" : "") +
		n.toString(hex ? 16 : 10).toUpperCase() : n
	) + ";";
}