/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);

/******/ 	};

/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		0:0
/******/ 	};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}

/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);

/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;

/******/ 			script.src = __webpack_require__.p + "" + chunkId + ".client.js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};

/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	eval("__webpack_require__.e/* require */(1, function(__webpack_require__) { var __WEBPACK_AMD_REQUIRE_ARRAY__ = [__webpack_require__(1), __webpack_require__(2), __webpack_require__(21), __webpack_require__(4), __webpack_require__(36), __webpack_require__(9), __webpack_require__(43), __webpack_require__(48), __webpack_require__(13), __webpack_require__(49), __webpack_require__(30), __webpack_require__(5), __webpack_require__(205), __webpack_require__(206), __webpack_require__(207), __webpack_require__(208), __webpack_require__(209), __webpack_require__(211), __webpack_require__(212), __webpack_require__(213), __webpack_require__(332), __webpack_require__(214), __webpack_require__(19), __webpack_require__(6), __webpack_require__(23), __webpack_require__(8), __webpack_require__(7), __webpack_require__(10), __webpack_require__(15), __webpack_require__(216), __webpack_require__(221), __webpack_require__(223), __webpack_require__(225), __webpack_require__(227), __webpack_require__(230), __webpack_require__(232), __webpack_require__(234), __webpack_require__(236), __webpack_require__(238), __webpack_require__(241), __webpack_require__(243), __webpack_require__(246), __webpack_require__(250), __webpack_require__(252), __webpack_require__(255), __webpack_require__(253), __webpack_require__(259), __webpack_require__(312), __webpack_require__(318), __webpack_require__(320), __webpack_require__(322)]; (function ($, ko, KOAmd, amplify, AppVM, DateUtils, Session, Audit, hopscotch, Chart) {\n    console.log('Init App');\n\n    // Chart.noConflict restores the Chart global variable to it's previous owner\n    // The function returns what was previously Chart, allowing you to reassign.\n    // var Chartjs = Chart.noConflict();\n    DateUtils.enableJSONDateHandling();\n\n    // Cleanup session\n    Session.clearContacts();\n\n    // Knockout AMD support setup\n    ko.amdTemplateEngine.defaultRequireTextPluginName = \"text\";\n    ko.amdTemplateEngine.defaultPath = \"/\";\n    ko.amdTemplateEngine.defaultSuffix = \".tmpl.html\";\n\n    // Register components\n    ko.components.register('user-profile-component', __webpack_require__(216));\n    ko.components.register('contact-component', __webpack_require__(221));\n    ko.components.register('add-contact-component', __webpack_require__(223));\n    ko.components.register('contact-widget-component', __webpack_require__(225));\n    ko.components.register('file-upload-component', __webpack_require__(227));\n    ko.components.register('summary-component', __webpack_require__(230));\n\n    ko.components.register('claims-component', __webpack_require__(250));\n    ko.components.register('claims-list-component', __webpack_require__(232));\n    ko.components.register('claim-selector-component', __webpack_require__(328));\n    ko.components.register('notifier-component', __webpack_require__(234));\n    ko.components.register('maps-component', __webpack_require__(236));\n    ko.components.register('travel-component', __webpack_require__(238));\n    ko.components.register('status-editor-component', __webpack_require__(241));\n    ko.components.register('stats-component', __webpack_require__(243));\n    ko.components.register('task-entry-component', __webpack_require__(246));\n    ko.components.register('admin-component', __webpack_require__(259));\n    ko.components.register('billing-component', __webpack_require__(312));\n    ko.components.register('billing-item-component', __webpack_require__(318));\n    ko.components.register('billing-profile-component', __webpack_require__(320));\n    ko.components.register('contact-sync-component', __webpack_require__(330));\n    ko.components.register('claim-form-component', __webpack_require__(322));\n\n    // Knockout bindings init\n    ko.applyBindings(new AppVM());\n\n    // Start Loggly\n    Audit.init();\n\n    // Util fn(s)\n    JSON.prettyPrint = function (str) {\n        var maxLength = 80;\n        return JSON.stringify(str).substring(0, maxLength);\n    };\n}.apply(null, __WEBPACK_AMD_REQUIRE_ARRAY__));});\n\n//////////////////\n// WEBPACK FOOTER\n// ./app/components/start.js\n// module id = 0\n// module chunks = 0\n//# sourceURL=webpack:///./app/components/start.js?");

/***/ }
/******/ ]);