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
var GoogleAssistantSsmlFormatter = /** @class */ (function (_super) {
    __extends(GoogleAssistantSsmlFormatter, _super);
    function GoogleAssistantSsmlFormatter(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        _this.validVoices = {
            'Ivy': { voice: { gender: 'female', variant: 1, language: 'en-US' } },
            'Joanna': { voice: { gender: 'female', variant: 2, language: 'en-US' } },
            'Joey': { voice: { gender: 'male', variant: 1, language: 'en-US' } },
            'Justin': { voice: { gender: 'male', variant: 2, language: 'en-US' } },
            'Kendra': { voice: { gender: 'female', variant: 3, language: 'en-US' } },
            'Kimberly': { voice: { gender: 'female', variant: 4, language: 'en-US' } },
            'Matthew': { voice: { gender: 'male', variant: 3, language: 'en-US' } },
            'Salli': { voice: { gender: 'male', variant: 4, language: 'en-US' } },
            'Nicole': { voice: { gender: 'female', variant: 1, language: 'en-AU' } },
            'Russell': { voice: { gender: 'male', variant: 1, language: 'en-AU' } },
            'Amy': { voice: { gender: 'female', variant: 1, language: 'en-GB' } },
            'Brian': { voice: { gender: 'male', variant: 1, language: 'en-GB' } },
            'Emma': { voice: { gender: 'female', variant: 2, language: 'en-GB' } },
            'Aditi': { voice: { gender: 'female', variant: 1, language: 'en-IN' } },
            'Raveena': { voice: { gender: 'female', variant: 2, language: 'en-IN' } },
            'Hans': { voice: { gender: 'male', variant: 1, language: 'de-DE' } },
            'Marlene': { voice: { gender: 'female', variant: 1, language: 'de-DE' } },
            'Vicki': { voice: { gender: 'female', variant: 2, language: 'de-DE' } },
            'Conchita': { voice: { gender: 'female', variant: 1, language: 'es-ES' } },
            'Enrique': { voice: { gender: 'male', variant: 1, language: 'es-ES' } },
            'Carla': { voice: { gender: 'female', variant: 1, language: 'it-IT' } },
            'Giorgio': { voice: { gender: 'male', variant: 1, language: 'it-IT' } },
            'Mizuki': { voice: { gender: 'female', variant: 1, language: 'ja-JP' } },
            'Takumi': { voice: { gender: 'male', variant: 1, language: 'ja-JP' } },
            'Celine': { voice: { gender: 'female', variant: 1, language: 'fr-FR' } },
            'Lea': { voice: { gender: 'female', variant: 2, language: 'fr-FR' } },
            'Mathieu': { voice: { gender: 'male', variant: 1, language: 'fr-FR' } },
        };
        _this.modifierKeyToSsmlTagMappings.interjection = null;
        _this.modifierKeyToSsmlTagMappings.whisper = 'prosody';
        _this.modifierKeyToSsmlTagMappings.lang = 'lang';
        return _this;
    }
    // tslint:disable-next-line: max-func-body-length
    GoogleAssistantSsmlFormatter.prototype.getTextModifierObject = function (ast) {
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
                        case 'characters':
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
                            textModifierObject.tag(ssmlTag, { volume: 'x-soft', rate: 'slow' });
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
                        case 'lang':
                            textModifierObject.tag(ssmlTag, { 'xml:lang': value });
                            break;
                        case 'voice':
                            textModifierObject.voiceTag(key, value);
                            break;
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
    GoogleAssistantSsmlFormatter.prototype.getSectionObject = function (ast) {
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
                    case 'voice':
                        sectionObject.voiceTag(key, value);
                        break;
                    case 'defaults': {
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
    GoogleAssistantSsmlFormatter.prototype.formatFromAst = function (ast, lines) {
        if (lines === void 0) { lines = []; }
        switch (ast.name) {
            case 'document': {
                if (this.options.includeFormatterComment) {
                    this.addComment('Converted from Speech Markdown to SSML for Google Assistant', lines);
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
                if (tmo_1.textOnly) {
                    // Quick return if tag is not supported
                    lines.push(tmo_1.text);
                    return lines;
                }
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
            case 'audio': {
                var url = ast.children[0].allText.replace(/&/g, '&amp;');
                return this.addTagWithAttrs(lines, null, 'audio', { src: url });
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
    return GoogleAssistantSsmlFormatter;
}(SsmlFormatterBase_1.SsmlFormatterBase));
exports.GoogleAssistantSsmlFormatter = GoogleAssistantSsmlFormatter;
//# sourceMappingURL=GoogleAssistantSsmlFormatter.js.map