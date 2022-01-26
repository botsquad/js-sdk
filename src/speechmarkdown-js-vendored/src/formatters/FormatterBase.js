"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FormatterBase = /** @class */ (function () {
    function FormatterBase(options) {
        this.options = options;
        this.options = options;
    }
    // Adds each element of the array as markdown
    FormatterBase.prototype.addArray = function (ast, lines) {
        for (var _i = 0, ast_1 = ast; _i < ast_1.length; _i++) {
            var child = ast_1[_i];
            this.formatFromAst(child, lines);
        }
        return lines;
    };
    FormatterBase.prototype.processAst = function (ast, lines) {
        if (ast instanceof Array) {
            this.addArray(ast, lines);
        }
        else {
            this.formatFromAst(ast, lines);
        }
    };
    return FormatterBase;
}());
exports.FormatterBase = FormatterBase;
//# sourceMappingURL=FormatterBase.js.map