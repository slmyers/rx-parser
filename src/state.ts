import * as fs from 'fs';

type State = {
    lines: string[],
    line: number
}

export class ParserState {
    private state: State;

    constructor(file: string){
        this.state = {
            lines: [],
            line: 0
        }
        const fileString = fs.readFileSync(file).toString('ascii');
        this.state.lines = fileString.split(/[\n\r]/g);
    }

    getCurrentLine() {
        return this.state.lines[this.state.line];
    }

    getLine(line: number) {
        return line < this.state.lines.length ? this.state.lines[line] : '';
    }

    setCurrentLine(line: number) {
        if (line < this.state.lines.length) this.state.line = line;
    }

    nextLine() {
        if (this.state.line + 1 < this.state.lines.length){
            this.state.line += 1;
            return this.state.lines[this.state.line];
        }
        return '';
    }
}
