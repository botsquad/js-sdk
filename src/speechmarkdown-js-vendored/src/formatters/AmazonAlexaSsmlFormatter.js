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
var AmazonAlexaSsmlFormatter = /** @class */ (function (_super) {
    __extends(AmazonAlexaSsmlFormatter, _super);
    function AmazonAlexaSsmlFormatter(options) {
        var _this = _super.call(this, options) || this;
        _this.options = options;
        _this.validVoices = {
            'Ivy': 'en-US',
            'Joanna': 'en-US',
            'Joey': 'en-US',
            'Justin': 'en-US',
            'Kendra': 'en-US',
            'Kimberly': 'en-US',
            'Matthew': 'en-US',
            'Salli': 'en-US',
            'Nicole': 'en-AU',
            'Russell': 'en-AU',
            'Amy': 'en-GB',
            'Brian': 'en-GB',
            'Emma': 'en-GB',
            'Aditi': 'en-IN',
            'Raveena': 'en-IN',
            'Hans': 'de-DE',
            'Marlene': 'de-DE',
            'Vicki': 'de-DE',
            'Conchita': 'es-ES',
            'Enrique': 'es-ES',
            'Carla': 'it-IT',
            'Giorgio': 'it-IT',
            'Mizuki': 'ja-JP',
            'Takumi': 'ja-JP',
            'Celine': 'fr-FR',
            'Lea': 'fr-FR',
            'Mathieu': 'fr-FR',
        };
        _this.validEmotionIntensity = [
            'low',
            'medium',
            'high',
        ];
        _this.modifierKeyToSsmlTagMappings.whisper = 'amazon:effect';
        _this.modifierKeyToSsmlTagMappings.lang = 'lang';
        _this.modifierKeyToSsmlTagMappings.voice = 'voice';
        _this.modifierKeyToSsmlTagMappings.dj = 'amazon:domain';
        _this.modifierKeyToSsmlTagMappings.newscaster = 'amazon:domain';
        _this.modifierKeyToSsmlTagMappings.excited = 'amazon:emotion';
        _this.modifierKeyToSsmlTagMappings.disappointed = 'amazon:emotion';
        return _this;
    }
    // tslint:disable-next-line: max-func-body-length
    AmazonAlexaSsmlFormatter.prototype.getTextModifierObject = function (ast) {
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
                        case 'interjection':
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
                        case 'lang':
                            textModifierObject.tag(ssmlTag, { 'xml:lang': value });
                            break;
                        case 'voice':
                            textModifierObject.voiceTag(key, value);
                            break;
                        case 'excited':
                        case 'disappointed': {
                            var intensity = (value || 'medium').toLowerCase();
                            if (this.validEmotionIntensity.includes(intensity)) {
                                textModifierObject.tag(ssmlTag, { 'name': key, 'intensity': intensity });
                                break;
                            }
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
    AmazonAlexaSsmlFormatter.prototype.getSectionObject = function (ast) {
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
                    case 'dj':
                        sectionObject.tag(ssmlTag, { 'name': 'music' });
                        break;
                    case 'newscaster':
                        sectionObject.tag(ssmlTag, { 'name': 'news' });
                        break;
                    case 'defaults': {
                        break;
                    }
                    case 'excited':
                    case 'disappointed': {
                        var intensity = (value || 'medium').toLowerCase();
                        if (this.validEmotionIntensity.includes(intensity)) {
                            sectionObject.tag(ssmlTag, { 'name': key, 'intensity': intensity });
                            break;
                        }
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
    AmazonAlexaSsmlFormatter.prototype.formatFromAst = function (ast, lines) {
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
                var text = (this.options.escapeXmlSymbols) ? this.escapeXmlCharacters(ast.allText)
                    : ast.allText;
                lines.push(text);
                return lines;
            }
            default: {
                this.processAst(ast.children, lines);
                return lines;
            }
        }
    };
    return AmazonAlexaSsmlFormatter;
}(SsmlFormatterBase_1.SsmlFormatterBase));
exports.AmazonAlexaSsmlFormatter = AmazonAlexaSsmlFormatter;
//# sourceMappingURL=AmazonAlexaSsmlFormatter.js.map