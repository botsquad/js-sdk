import { Parser } from './Interfaces';
import { SpeechOptions } from "./SpeechOptions";
export declare class SpeechMarkdown {
    private options?;
    private parser;
    private readonly defaults;
    constructor(options?: SpeechOptions);
    readonly Parser: Parser;
    toText(speechmarkdown: string, options?: SpeechOptions): string;
    toSSML(speechmarkdown: string, options?: SpeechOptions): string;
    toAST(speechmarkdown: string): any;
    toASTString(speechmarkdown: string): string;
}
