import * as Rx from 'rxjs';
import { charRange, mergeLet } from '../utilities';
import * as PartOne from '../parser-part-one';


const anyOf = (chars: Rx.Observable<PartOne.Character>): Rx.Observable<PartOne.Parser> => {
    return chars.map(char => PartOne.pchar(char))
        .reduce((all, parser) => all === undefined ? parser : PartOne.orElse(all, parser));
}

const pstring = (chars : Rx.Observable<PartOne.Character>): Rx.Observable<PartOne.Parser> => {
    return chars.map(char => PartOne.pchar(char))
        .reduce((all, parser) => all === undefined ? parser : PartOne.andThen(all, parser));
}

const zeroOrMore = (parser1) => {
    return (input$: Rx.Observable<PartOne.Response>) => {
        return input$
                .expand( response => Rx.Observable.of(response).let(parser1))
                .last()
                .catch(err => Rx.Observable.of(err).map( ([res, progress, curr]) => [true, progress, curr]));
    }
}

const many = (char: Rx.Observable<PartOne.Character>) => {
    return char.map( char => PartOne.pchar(char))
        .reduce((all, parser) => all === undefined ? parser : zeroOrMore(parser));
}

function run() {
    const sub = {
        next: val => {console.log('------\n next'); console.log(val);console.log('------\n'); },
        error: val => {console.log('------\n error'); console.log(val);console.log('------\n'); },
    }

    const runs = [
        /*
        () => {
            const parser = mergeLet(anyOf(charRange('a..c')));
            console.log(`parse 'a..c' from 'ab'`)
            return Rx.Observable.of(<PartOne.Response>[undefined, '', 'ab']).let(parser)
        },
        () => {
            const parser = mergeLet(anyOf(charRange('a..c')));
            console.log(`parse 'a..c' from 'db'`)
            return Rx.Observable.of(<PartOne.Response>[undefined, '', 'db']).let(parser)
        },
        () => {
            const firstParse = mergeLet(anyOf(charRange('a..c')));
            const secondParse =  mergeLet(anyOf(charRange('f..D')))
            const combinedParses = PartOne.andThen(firstParse, secondParse);
            console.log(`parse "'a..c' and then 'f..D'" from 'ag'`)

            return Rx.Observable.of(<PartOne.Response>[undefined, '', 'ag']).let(combinedParses)
        },
        () => {
            const stringParser = mergeLet(pstring(Rx.Observable.from('blah')));
            console.log(`parse "'blah'" from 'blah'`)
            return Rx.Observable.of(<PartOne.Response>[undefined, '', 'blah']).let(stringParser)
        },
        () => {
            const stringParser = mergeLet(pstring(Rx.Observable.from('blah')));
            console.log(`parse "'blah'" from 'bleh'`)
            return Rx.Observable.of(<PartOne.Response>[undefined, '', 'bleh']).let(stringParser)
        },*/
        () => {
            const parser = mergeLet(many(Rx.Observable.from('1234567890')));
            console.log(`parse '780' from "780 is my area code"`);
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "780 is my area code"])
                .let(parser);
        },
        () => {
            const parser = mergeLet(many(Rx.Observable.from('1234567890')));
            console.log(`parse '' from "my area code is 780"`);
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "my area code is 780"])
                .let(parser);
        },
        /*() => {
            const parser = zeroOrMore(PartOne.pchar('b'));
            console.log(`parse '' from "aabbcc"`);
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "aabbcc"]).let(parser);
        },
        () => {
            const parser = zeroOrMore(PartOne.pchar('a'));
            console.log(`parse 'a' from "a"`);
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "a"]).let(parser);
        },
        () => {
            const parser = zeroOrMore(PartOne.pchar('a'));
            console.log(`parse 'aaa' from "aaabbcc"`);
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "aaabbcc"]).let(parser);
        },
        () => {
            const parser = mergeLet(many(Rx.Observable.from('ab')));
            console.log(`parse 'a' from 'aab'`)
            return Rx.Observable.of(<PartOne.Response>[undefined, '', "aab"]).let(parser);
        }*/
    ];

    runs.forEach( (run, index) => {
        console.log(`run #${index}`)
        run().subscribe(sub)
    })
}

run();