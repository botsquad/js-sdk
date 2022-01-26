import { Parser } from './Interfaces';
export declare class SpeechMarkdownParser implements Parser {
    private parser;
    private myna;
    constructor();
    parse(speechmarkdown: string): any;
}
