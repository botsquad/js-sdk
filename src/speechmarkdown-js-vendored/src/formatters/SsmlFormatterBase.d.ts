import { SpeechOptions } from '../SpeechOptions';
import { FormatterBase } from './FormatterBase';
export declare class TagsObject {
    private base;
    tags: any;
    text: any;
    constructor(base: SsmlFormatterBase);
    tag(tag: string, attrs: object, augment?: boolean): void;
    protected voiceTagNamed(voices: null | object, name: string): boolean;
    voiceTag(tag: string, value: string): void;
}
declare type Dictionary<T> = {
    [key: string]: T;
};
export declare abstract class SsmlFormatterBase extends FormatterBase {
    protected options: SpeechOptions;
    static readonly XML_ESCAPE_MAPPING: Dictionary<string>;
    static readonly XML_UNESCAPE_MAPPING: Dictionary<string>;
    protected constructor(options: SpeechOptions);
    protected sectionTags: string[];
    protected modifierKeyMappings: any;
    protected ssmlTagSortOrder: string[];
    protected modifierKeyToSsmlTagMappings: any;
    format(ast: any): string;
    protected addSectionStartTag(tagsSortedAsc: string[], so: any, lines: string[]): void;
    protected addSectionEndTag(lines: string[]): void;
    protected addTag(tag: string, ast: any, newLine: boolean, newLineAfterEnd: boolean, attr: any, lines: string[]): string[];
    protected addSpeakTag(ast: any, newLine: boolean, newLineAfterEnd: boolean, attr: any, lines: string[]): string[];
    protected addComment(commentText: string, lines: string[]): string[];
    protected startTag(tag: string, attr: any, newLine?: boolean): string;
    protected endTag(tag: string, newLine?: boolean): string;
    protected voidTag(tag: string, attr: any): string;
    protected addTagWithAttrs(lines: string[], text: string, tag: string, attrs: any, forceEndTag?: boolean): string[];
    protected getTagWithAttrs(text: string, tag: string, attrs: any): string;
    protected sentenceCase(text: string): string;
    escapeXmlCharacters(unescaped: string): string;
    protected abstract formatFromAst(ast: any, lines: string[]): string[];
}
export {};
