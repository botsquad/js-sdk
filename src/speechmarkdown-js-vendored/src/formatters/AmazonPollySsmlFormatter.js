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
var SsmlFormatterBase_1 = require("./SsmlFormatterBase");
var AmazonPollySsmlFormatter = /** @class */ (function (_super) {
    __extends(AmazonPollySsmlFormatter, _super);
    function AmazonPollySsmlFormatter(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        _this.modifierKeyToSsmlTagMappings.whisper = 'amazon:effect';
        _this.modifierKeyToSsmlTagMappings.timbre = 'amazon:effect';
        _this.modifierKeyToSsmlTagMappings.cardinal = 'say-as';
        _this.modifierKeyToSsmlTagMappings.digits = 'say-as';
        _this.modifierKeyToSsmlTagMappings.drc = 'amazon:effect';
        _this.modifierKeyToSsmlTagMappings.lang = 'lang';
        _this.modifierKeyMappings.digits = 'digits';
        _this.modifierKeyMappings.cardinal = 'cardinal';
        return _this;
    }
    // tslint:disable-next-line: max-func-body-length
    AmazonPollySsmlFormatter.prototype.getTextModifierObject = function (ast) {
        var textModifierObject = new SsmlFormatterBase_1.TagsObject(this);
        for (var index = 0; index < ast.children.length; index++) {
            var child = ast.children[index];
            switch (child.name) {
                case 'plainText':
                case 'plainTextSpecialChars':
                case 'plainTextEmphasis':
                case 'plainTextPhone':
                case 'plainTextModifier': {
                    textModifierObject['text'] = child.allText;
                    break;
                }
                case 'textModifierKeyOptionalValue': {
                    var key = child.children[0].allText;
                    key = this.modifierKeyMappings[key] || key;
                    var value = child.children.length === 2 ? child.children[1].allText : '';
                    var ssmlTag = this.modifierKeyToSsmlTagMappings[key];
                    switch (key) {
                        case 'emphasis':
                            textModifierObject.tag(ssmlTag, { level: value || 'moderate' });
                            break;
                        case 'address':
                        case 'cardinal':
                        case 'characters':
                        case 'digits':
                        case 'expletive':
                        case 'fraction':
                        case 'number':
                        case 'ordinal':
                        case 'telephone':
                        case 'unit':
                            textModifierObject.tag(ssmlTag, { 'interpret-as': key });
                            break;
                        case 'date':
                            textModifierObject.tag(ssmlTag, { 'interpret-as': key, format: value || 'ymd' });
                            break;
                        case 'time':
                            textModifierObject.tag(ssmlTag, { 'interpret-as': key, format: value || 'hms12' });
                            break;
                        case 'whisper':
                            textModifierObject.tag(ssmlTag, { name: 'whispered' });
                            break;
                        case 'ipa':
                            textModifierObject.tag(ssmlTag, { alphabet: key, ph: value });
                            break;
                        case 'sub':
                            textModifierObject.tag(ssmlTag, { alias: value });
                            break;
                        case 'volume':
                        case 'rate':
                        case 'pitch': {
                            var attrs = {};
                            attrs[key] = value || 'medium';
                            textModifierObject.tag(ssmlTag, attrs, true);
                            break;
                        }
                        case 'timbre':
                            textModifierObject.tag(ssmlTag, { "vocal-tract-length": value });
                            break;
                        case 'lang':
                            textModifierObject.tag(ssmlTag, { 'xml:lang': value });
                            break;
                        case 'drc':
                            textModifierObject.tag(ssmlTag, { 'name': key });
                            break;
                        case 'voice':
                        case 'excited':
                        case 'disappointed': {
                            break;
                        }
                        default: {
                        }
                    }
                    break;
                }
            }
        }
        return textModifierObject;
    };
    // tslint:disable-next-line: max-func-body-length
    AmazonPollySsmlFormatter.prototype.getSectionObject = function (ast) {
        var sectionObject = new SsmlFormatterBase_1.TagsObject(this);
        for (var index = 0; index < ast.children.length; index++) {
            var child = ast.children[index];
            if (child.name === 'sectionModifierKeyOptionalValue') {
                var key = child.children[0].allText;
                var value = child.children.length === 2 ? child.children[1].allText : '';
                var ssmlTag = this.modifierKeyToSsmlTagMappings[key];
                switch (key) {
                    case 'lang':
                        sectionObject.tag(ssmlTag, { 'xml:lang': value });
                        break;
                    case 'defaults': {
                        break;
                    }
                    case 'voice':
                    case 'dj':
                    case 'newscaster':
                    case 'excited':
                    case 'disappointed': {
                        break;
                    }
                    default: {
                    }
                }
            }
        }
        return sectionObject;
    };
    // tslint:disable-next-line: max-func-body-length
    AmazonPollySsmlFormatter.prototype.formatFromAst = function (ast, lines) {
        if (lines === void 0) { lines = []; }
        switch (ast.name) {
            case 'document': {
                if (this.options.includeFormatterComment) {
                    this.addComment('Converted from Speech Markdown to SSML for Amazon Alexa', lines);
                }
                if (this.options.includeSpeakTag) {
                    return this.addSpeakTag(ast.children, true, false, null, lines);
                }
                else {
                    this.processAst(ast.children, lines);
                    return lines;
                }
            }
            case 'paragraph': {
                if (this.options.includeParagraphTag) {
                    return this.addTag('p', ast.children, true, false, null, lines);
                }
                else {
                    this.processAst(ast.children, lines);
                    return lines;
                }
            }
            case 'shortBreak': {
                var time = ast.children[0].allText;
                return this.addTagWithAttrs(lines, null, 'break', { time: time });
            }
            case 'break': {
                var val = ast.children[0].allText;
                var attrs = {};
                switch (ast.children[0].children[0].name) {
                    case 'breakStrengthValue':
                        attrs = { strength: val };
                        break;
                    case 'time':
                        attrs = { time: val };
                        break;
                }
                return this.addTagWithAttrs(lines, null, 'break', attrs);
            }
            case 'markTag': {
                var name = ast.children[0].allText;
                return this.addTagWithAttrs(lines, null, 'mark', { name: name });
            }
            case 'shortEmphasisModerate': {
                var text = ast.children[0].allText;
                return this.addTagWithAttrs(lines, text, 'emphasis', { level: 'moderate' });
            }
            case 'shortEmphasisStrong': {
                var text = ast.children[0].allText;
                return this.addTagWithAttrs(lines, text, 'emphasis', { level: 'strong' });
            }
            case 'shortEmphasisNone': {
                var text = ast.children[0].allText;
                return this.addTagWithAttrs(lines, text, 'emphasis', { level: 'none' });
            }
            case 'shortEmphasisReduced': {
                var text = ast.children[0].allText;
                return this.addTagWithAttrs(lines, text, 'emphasis', { level: 'reduced' });
            }
            case 'textModifier': {
                var tmo_1 = this.getTextModifierObject(ast);
                var tagsSortedDesc = Object.keys(tmo_1.tags).sort(function (a, b) { return tmo_1.tags[b].sortId - tmo_1.tags[a].sortId; });
                var inner = tmo_1.text;
                for (var index = 0; index < tagsSortedDesc.length; index++) {
                    var tag = tagsSortedDesc[index];
                    var attrs = tmo_1.tags[tag].attrs;
                    inner = this.getTagWithAttrs(inner, tag, attrs);
                }
                lines.push(inner);
                return lines;
            }
            case 'section': {
                var so_1 = this.getSectionObject(ast);
                var tagsSortedAsc = Object.keys(so_1.tags).sort(function (a, b) { return so_1.tags[a].sortId - so_1.tags[b].sortId; });
                this.addSectionEndTag(lines);
                this.addSectionStartTag(tagsSortedAsc, so_1, lines);
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
            case 'plainTextSpecialChars': {
                lines.push(ast.allText);
                return lines;
            }
            default: {
                this.processAst(ast.children, lines);
                return lines;
            }
        }
    };
    return AmazonPollySsmlFormatter;
}(SsmlFormatterBase_1.SsmlFormatterBase));
exports.AmazonPollySsmlFormatter = AmazonPollySsmlFormatter;
//# sourceMappingURL=AmazonPollySsmlFormatter.js.map