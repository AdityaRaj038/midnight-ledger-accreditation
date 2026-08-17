"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/@subsquid+util-internal-hex@1.2.3";
exports.ids = ["vendor-chunks/@subsquid+util-internal-hex@1.2.3"];
exports.modules = {

/***/ "(ssr)/../node_modules/.pnpm/@subsquid+util-internal-hex@1.2.3/node_modules/@subsquid/util-internal-hex/lib/hex.js":
/*!*******************************************************************************************************************!*\
  !*** ../node_modules/.pnpm/@subsquid+util-internal-hex@1.2.3/node_modules/@subsquid/util-internal-hex/lib/hex.js ***!
  \*******************************************************************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("\nvar __importDefault = (this && this.__importDefault) || function (mod) {\n    return (mod && mod.__esModule) ? mod : { \"default\": mod };\n};\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.toHex = toHex;\nexports.isHex = isHex;\nexports.decodeHex = decodeHex;\nconst assert_1 = __importDefault(__webpack_require__(/*! assert */ \"assert\"));\nfunction toHex(data, offset = 0, size = data.length - offset) {\n    return `0x${Buffer.from(data.buffer, data.byteOffset + offset, size).toString('hex')}`;\n}\nfunction isHex(value) {\n    return typeof value == 'string' && value.length % 2 == 0 && /^0x[a-f\\d]*$/i.test(value);\n}\nfunction decodeHex(value) {\n    (0, assert_1.default)(isHex(value));\n    return Buffer.from(value.slice(2), 'hex');\n}\n//# sourceMappingURL=hex.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzLy5wbnBtL0BzdWJzcXVpZCt1dGlsLWludGVybmFsLWhleEAxLjIuMy9ub2RlX21vZHVsZXMvQHN1YnNxdWlkL3V0aWwtaW50ZXJuYWwtaGV4L2xpYi9oZXguanMiLCJtYXBwaW5ncyI6IkFBQWE7QUFDYjtBQUNBLDZDQUE2QztBQUM3QztBQUNBLDhDQUE2QyxFQUFFLGFBQWEsRUFBQztBQUM3RCxhQUFhO0FBQ2IsYUFBYTtBQUNiLGlCQUFpQjtBQUNqQixpQ0FBaUMsbUJBQU8sQ0FBQyxzQkFBUTtBQUNqRDtBQUNBLGdCQUFnQix5RUFBeUU7QUFDekY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJDOlxcVXNlcnNcXHNpbmdoXFxEb3dubG9hZHNcXE1pZG5pZ2h0IHByb2plY3RzXFxaZWVkXFxub2RlX21vZHVsZXNcXC5wbnBtXFxAc3Vic3F1aWQrdXRpbC1pbnRlcm5hbC1oZXhAMS4yLjNcXG5vZGVfbW9kdWxlc1xcQHN1YnNxdWlkXFx1dGlsLWludGVybmFsLWhleFxcbGliXFxoZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnRvSGV4ID0gdG9IZXg7XG5leHBvcnRzLmlzSGV4ID0gaXNIZXg7XG5leHBvcnRzLmRlY29kZUhleCA9IGRlY29kZUhleDtcbmNvbnN0IGFzc2VydF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJhc3NlcnRcIikpO1xuZnVuY3Rpb24gdG9IZXgoZGF0YSwgb2Zmc2V0ID0gMCwgc2l6ZSA9IGRhdGEubGVuZ3RoIC0gb2Zmc2V0KSB7XG4gICAgcmV0dXJuIGAweCR7QnVmZmVyLmZyb20oZGF0YS5idWZmZXIsIGRhdGEuYnl0ZU9mZnNldCArIG9mZnNldCwgc2l6ZSkudG9TdHJpbmcoJ2hleCcpfWA7XG59XG5mdW5jdGlvbiBpc0hleCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycgJiYgdmFsdWUubGVuZ3RoICUgMiA9PSAwICYmIC9eMHhbYS1mXFxkXSokL2kudGVzdCh2YWx1ZSk7XG59XG5mdW5jdGlvbiBkZWNvZGVIZXgodmFsdWUpIHtcbiAgICAoMCwgYXNzZXJ0XzEuZGVmYXVsdCkoaXNIZXgodmFsdWUpKTtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWUuc2xpY2UoMiksICdoZXgnKTtcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWhleC5qcy5tYXAiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/.pnpm/@subsquid+util-internal-hex@1.2.3/node_modules/@subsquid/util-internal-hex/lib/hex.js\n");

/***/ })

};
;