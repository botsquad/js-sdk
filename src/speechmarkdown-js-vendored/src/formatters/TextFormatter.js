"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FormatterBase_1 = require("./FormatterBase");
var TextFormatter = /** @class */ (function (_super) {
    __extends(TextFormatter, _super);
    function TextFormatter(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        return _this;
    }
    TextFormatter.prototype.format = function (ast) {
        var lines = this.formatFromAst(ast, []);
        var txt = lines.join('').trim();
        // replace multiple whitespace with a single space
        // tslint:disable-next-line: no-regex-spaces
        txt = txt.replace(/  +/g, ' ');
        return txt;
    };
    TextFormatter.prototype.formatFromAst = function (ast, lines) {
        if (lines === void 0) { lines = []; }
        switch (ast.name) {
            case 'document': {
                this.processAst(ast.children, lines);
                return lines;
            }
            case 'paragraph': {
                this.processAst(ast.children, lines);
                return lines;
            }
            case 'simpleLine': {
                this.processAst(ast.children, lines);
                return lines;
            }
            case 'lineEnd': {
                lines.push(ast.allText);
                return lines;
            }
            case 'emptyLine': {
                if (this.options.preserveEmptyLines) {
                    lines.push(ast.allText);
                }
                return lines;
            }
            case 'plainText':
            case 'plainTextSpecialChars':
            case 'plainTextEmphasis':
            case 'plainTextPhone':
            case 'plainTextModifier': {
                lines.push(ast.allText);
                return lines;
            }
            default: {
                this.processAst(ast.children, lines);
                return lines;
            }
        }
    };
    return TextFormatter;
}(FormatterBase_1.FormatterBase));
exports.TextFormatter = TextFormatter;
//# sourceMappingURL=TextFormatter.js.map