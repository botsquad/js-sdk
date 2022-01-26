"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var myna_parser_1 = require("myna-parser");
var SpeechMarkdownGrammar_1 = require("./SpeechMarkdownGrammar");
var SpeechMarkdownParser = /** @class */ (function () {
    function SpeechMarkdownParser() {
        this.myna = myna_parser_1.Myna;
        SpeechMarkdownGrammar_1.speechMarkdownGrammar(this.myna);
        this.parser = this.myna.parsers.speechmarkdown;
    }
    SpeechMarkdownParser.prototype.parse = function (speechmarkdown) {
        // tslint:disable-next-line: no-unnecessary-local-variable
        return this.parser(speechmarkdown);
    };
    return SpeechMarkdownParser;
}());
exports.SpeechMarkdownParser = SpeechMarkdownParser;
//# sourceMappingURL=SpeechMarkdownParser.js.map