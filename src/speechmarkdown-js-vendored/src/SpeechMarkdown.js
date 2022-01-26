"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var factory = __importStar(require("./formatters/FormatterFactory"));
var SpeechMarkdownParser_1 = require("./SpeechMarkdownParser");
var SpeechMarkdown = /** @class */ (function () {
    function SpeechMarkdown(options) {
        this.options = options;
        this.defaults = {
            includeFormatterComment: false,
            includeParagraphTag: false,
            includeSpeakTag: true,
            platform: '',
            preserveEmptyLines: true,
        };
        this.options = __assign(__assign({}, this.defaults), options);
    }
    Object.defineProperty(SpeechMarkdown.prototype, "Parser", {
        get: function () {
            if (!this.parser) {
                this.parser = new SpeechMarkdownParser_1.SpeechMarkdownParser();
            }
            return this.parser;
        },
        enumerable: true,
        configurable: true
    });
    SpeechMarkdown.prototype.toText = function (speechmarkdown, options) {
        var methodOptions = __assign(__assign({}, this.options), options);
        var ast = this.Parser.parse(speechmarkdown);
        var formatter = factory.createTextFormatter(methodOptions);
        return formatter.format(ast);
    };
    SpeechMarkdown.prototype.toSSML = function (speechmarkdown, options) {
        var methodOptions = __assign(__assign({}, this.options), options);
        var ast = this.Parser.parse(speechmarkdown);
        // console.log(`AST: ${ast}`);
        var formatter = factory.createFormatter(methodOptions);
        return formatter.format(ast);
    };
    SpeechMarkdown.prototype.toAST = function (speechmarkdown) {
        return this.Parser.parse(speechmarkdown);
    };
    SpeechMarkdown.prototype.toASTString = function (speechmarkdown) {
        var ast = this.Parser.parse(speechmarkdown);
        return ast.toString();
    };
    return SpeechMarkdown;
}());
exports.SpeechMarkdown = SpeechMarkdown;
//# sourceMappingURL=SpeechMarkdown.js.map