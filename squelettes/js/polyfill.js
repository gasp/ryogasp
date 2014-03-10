// 
//  polyfill.js
//  ryogasp
//

// console.log for lame browsers
(function(c) {
	'use strict';
	var prop, method,
		empty = {},
		dummy = function() {},
		properties = 'memory'.split(','),
		methods = ('assert,clear,constructor,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,'
		+ 'info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn').split(',');
	while (prop = properties.pop()) c[prop] = c[prop] || empty;
	while (method = methods.pop()) c[method] = c[method] || dummy;
})(window.console = window.console || {});

// Function.bind polyfill for ie8-
// from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
	Function.prototype.bind = function(oThis) {
		if (typeof this !== "function") {
			// closest thing possible to the ECMAScript 5 internal IsCallable function
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}

		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function() {},
			fBound = function() {
				return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments)));
			};

		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();

		return fBound;
	};
};