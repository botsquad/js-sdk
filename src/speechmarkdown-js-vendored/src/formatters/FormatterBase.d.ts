import { Formatter } from '../Interfaces';
import { SpeechOptions } from '../SpeechOptions';
export declare abstract class FormatterBase implements Formatter {
    protected options: SpeechOptions;
    protected constructor(options: SpeechOptions);
    abstract format(ast: any): string;
    protected addArray(ast: any, lines: string[]): string[];
    protected processAst(ast: any, lines: string[]): void;
    protected abstract formatFromAst(ast: any, lines: string[]): string[];
}
