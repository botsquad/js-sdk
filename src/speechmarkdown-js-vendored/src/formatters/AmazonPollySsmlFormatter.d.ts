import { SpeechOptions } from '../SpeechOptions';
import { SsmlFormatterBase } from './SsmlFormatterBase';
export declare class AmazonPollySsmlFormatter extends SsmlFormatterBase {
    options: SpeechOptions;
    constructor(options: SpeechOptions);
    private getTextModifierObject;
    private getSectionObject;
    protected formatFromAst(ast: any, lines?: string[]): string[];
}
