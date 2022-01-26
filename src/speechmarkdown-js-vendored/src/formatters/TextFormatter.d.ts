import { SpeechOptions } from '../SpeechOptions';
import { FormatterBase } from './FormatterBase';
export declare class TextFormatter extends FormatterBase {
    protected options: SpeechOptions;
    constructor(options: SpeechOptions);
    format(ast: any): string;
    protected formatFromAst(ast: any, lines?: string[]): string[];
}
