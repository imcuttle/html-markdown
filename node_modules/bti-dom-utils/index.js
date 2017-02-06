/**
 * # DOM Utilities
 *
 * This is a collection of common utility methods for the DOM. While similar in nature to libraries like jQuery, this library aims to provide methods for unique and odd features.
 */

var Node = global.Node;
var Element = global.Element;

/**
 * ## isNode()
 *
 * Determines if a value is a DOM node.
 *
 * #### Arguments
 *
 * - **value** _mixed_ - A value to test as a DOM node.
 */
var isNode =
exports.isNode = function(node) {
	return node != null && typeof node.nodeType === "number";
}

/**
 * ## matchesSelector()
 *
 * A cross browser compatible solution to testing a DOM element against a CSS selector.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to test.
 * - **selector** _string_ - A CSS selector.
 */
var matchesSelector = typeof Element !== "undefined" ?
	Element.prototype.matches ||
	Element.prototype.webkitMatchesSelector ||
	Element.prototype.mozMatchesSelector ||
	Element.prototype.msMatchesSelector :
	function() { return false; };

exports.matchesSelector = function(node, selector) {
	return matchesSelector.call(node, selector)
}

/**
 * ## matches()
 *
 * Similar to `matchesSelector()`, this method will test a DOM node against CSS selectors, other DOM nodes and functions.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to test.
 * - **selector** _string | function | Node | Array_ - A CSS selector, a function (called with one argument, the node) or a DOM node. Pass an array of selectors to match any of them.
 */
var matches =
exports.matches = function(node, selector) {
	if (Array.isArray(selector)) return selector.some(function(s) {
		return matches(node, s);
	});

	if (isNode(selector)) {
		return node === selector;
	}
	
	if (typeof selector === "function") {
		return !!selector(node);
	}
	
	if (node.nodeType === Node.ELEMENT_NODE) {
		return matchesSelector.call(node, selector);
	}

	return false;
};

/**
 * ## closest()
 *
 * Stating at `elem`, this method traverses up the parent nodes and returns the first one that matches `selector`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to test.
 * - **selector** _string | function | Node_ - A CSS selector, a function (called with one argument, the node) or a DOM node.
 */
exports.closest = function(elem, selector) {
	while (elem != null) {
		if (elem.nodeType === 1 && matches(elem, selector)) return elem;
		elem = elem.parentNode;
	}

	return null;
};

/**
 * ## requestAnimationFrame()
 *
 * A cross-browser requestAnimationFrame. Fall back on `setTimeout()` if requestAnimationFrame isn't defined.
 *
 * #### Arguments
 *
 * - **fn** _function_ - A funciton to call on the next animation frame.
 */
exports.requestAnimationFrame =
	window.requestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	function (f) { setTimeout(f, 16); };

/**
 * ## getFirstLeafNode()
 *
 * Returns the first descendant node without children or `null` if doesn't exist.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to find the first leaf of.
 */
var getFirstLeafNode =
exports.getFirstLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.firstChild;
	return node;
}

/**
 * ## getLastLeafNode()
 *
 * Returns the last descendant node without children or `null` if doesn't exist.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A DOM node to find the last leaf of.
 */
var getLastLeafNode =
exports.getLastLeafNode = function(node) {
	while (node.hasChildNodes()) node = node.lastChild;
	return node;
}

/**
 * ## getNextExtendedSibling()
 *
 * Returns the next sibling of this node, a direct ancestor node's next sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the next extended sibling of.
 */
var getNextExtendedSibling =
exports.getNextExtendedSibling = function(node) {
	while (node != null) {
		if (node.nextSibling != null) return node.nextSibling;
		node = node.parentNode;
	}

	return null;
}

/**
 * ## getPreviousExtendedSibling()
 *
 * Returns the previous sibling of this node, a direct ancestor node's previous sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the previous extended sibling of.
 */
var getPreviousExtendedSibling =
exports.getPreviousExtendedSibling = function(node) {
	while (node != null) {
		if (node.previousSibling != null) return node.previousSibling;
		node = node.parentNode;
	}

	return null;
}

/**
 * ## getNextNode()
 *
 * Gets the next node in the DOM tree. This is either the first child node, the next sibling node, a direct ancestor node's next sibling, or `null`.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the next node of.
 */
var getNextNode =
exports.getNextNode = function(node) {
	return node.hasChildNodes() ? node.firstChild : getNextExtendedSibling(node);
}

/**
 * ## getPreviousNode()
 *
 * Gets the previous node in the DOM tree. This will return the previous extended sibling's last, deepest leaf node or `null` if doesn't exist. This returns the exact opposite result of `getNextNode` (ie `getNextNode(getPreviousNode(node)) === node`).
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the previous node of.
 */
var getPreviousNode =
exports.getPreviousNode = function(node) {
	return node.previousSibling == null ? node.parentNode : getLastLeafNode(node.previousSibling);
}

/**
 * ## getTextContent()
 *
 * Gets the text content of a node and its descendants. This is the text content that is visible to a user viewing the HTML from browser. Hidden nodes, such as comments, are not included in the output.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node to get the text content of.
 */
var getTextContent =
exports.getTextContent = function(node) {
	if (Array.isArray(node)) return node.map(getTextContent).join("");

	switch(node.nodeType) {
		case Node.DOCUMENT_NODE:
		case Node.DOCUMENT_FRAGMENT_NODE:
			return getTextContent(Array.prototype.slice.call(node.childNodes, 0));

		case Node.ELEMENT_NODE:
			if (typeof node.innerText === "string") return node.innerText;		// webkit
			if (typeof node.textContent === "string") return node.textContent;	// firefox
			return getTextContent(Array.prototype.slice.call(node.childNodes, 0));// other
		
		case Node.TEXT_NODE:
			return node.nodeValue || "";

		default:
			return "";
	}
}

/**
 * ## getRootNode()
 *
 * Returns the root node of a DOM tree.
 *
 * #### Arguments
 *
 * - **node** _Node_ - A node in the DOM tree you need the root of.
 */
var getRootNode =
exports.getRootNode = function(node) {
	while (node.parentNode != null) {
		node = node.parentNode
	}
	
	return node;
}

/**
 * ## contains()
 *
 * Determines if a node is a direct ancestor of another node. This is the same syntax as jQuery's `$.contains()`.
 *
 * #### Arguments
 *
 * - **parent** _Node_ - The ancestor node.
 * - **node** _Node_ - The node which may or may not be a descendant of the parent.
 */
var contains =
exports.contains = function(parent, node) {
	while (node != null) {
		if (matches(node, parent)) return true;
		node = node.parentNode;
	}
	
	return false;
}