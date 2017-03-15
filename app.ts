import * as Rx from 'rxjs/Rx';

type ParserCombinator<T> = (parser1: Parser<T>, parser2: Parser<T>) => Parser<T>;
type ParseFn<T> = (input$: Rx.Observable<T>) => Rx.Observable<T>;
type ParserLabel = string;
type Parser<T> = {
    target: T,
    parseFn: (input$: Rx.Observable<Result>) => Rx.Observable<Result>,
    label: ParserLabel
}
type Result = [ boolean, string, string, string ];
type Character = string;
const isCharacter = (c: any): c is Character => typeof c == 'string' && c.length === 1;

const processResult = (result: Result) => {
    const [ res, progress, current, label ] = result;
    return `${label} ${res}: [${progress}, ${current}]`;
} 

const printResult = (result: Result) => console.log(processResult(result));

const testFn: Parser<Character> = {
    target: 'b',
    parseFn: (input$) => input$,
    label: '[TEST LABEL]: EXPECTING X GOT Y'
}



const pchar = (target: Character, fn: (char) => boolean, label: ParserLabel): Parser<Character> => {
    
    const parseFn = (input$: Rx.Observable<Result>): Rx.Observable<Result> => {
        return input$
            .filter( ([, , s]) => s.length > 0)
            .mergeMap(resp => {
                const [ , progress, str ] = resp
                const [car, cdr] = [ str[0], str.substr(1, str.length - 1) ]

                return Rx.Observable.if( () => fn(car), 
                    Rx.Observable.of([true, progress + car , cdr, label]), 
                    Rx.Observable.throw([false, progress, str, label])
                )
            })
    };

    return {
        target,
        parseFn,
        label
    }

}

const andThen = (parser1, parser2) => {

    return (input$: Rx.Observable<any>) => {
        return input$
            .let(parser1)
            .let(parser2)
    }
}

const orElse = (parser1, parser2) => {
    parser1.label = `[orElse: ${parser1.label}, ${parser2.label}]: cause: [${parser1.label}]`
    parser2.label = `[orElse: ${parser1.label}, ${parser2.label}]: cause: [${parser2.label}]`

    return (input$: Rx.Observable<any>) => {
        return input$
            .let(parser1.parseFn)
            .catch( _ => input$.let(parser2.parseFn))
    }
}

const anyOf = (chars: string) => {
    const parser = chars.split('')
                .map( target => pchar(target, (char) => char === target, `[pchar: ${target}]`) )
                .reduce( (all, parser) => [...all, parser], [])
                .reduce( (all, parser) => orElse(all, parser));

    parser.label = `[anyOf: ${chars}]`;
    return parser;
}

const pstring = (chars: string) => {
    const parser = chars.split('')
                .map( target => pchar(target, (char) => char === target, `[pchar: ${target}]`) )
                .reduce( (all, parser) => [...all, parser], [])
                .reduce( (all, parser) => andThen(all, parser));

    parser.label = `[pstring: ${chars}]`;
    return parser;
}

const zeroOrMore = (parser1) => {
    return (input$: Rx.Observable<any>) => {
        return input$
                .expand( response => Rx.Observable.of(response).let(parser1.parseFn))
                .last()
                .catch(err => {
                    const [res, progress, curr, label] = err;
                    return Rx.Observable.of(err).map( ([res, progress, curr, label]) => [true, progress, curr, label])
                })
    }
}

const many = (chars: string) => {
    const internalParsers =  chars.split('')
                .map(target => pchar(target, (char) => char === target, `[pchar: ${target}]`))
                .reduce( (all, parser) => [...all, parser], [])
                .reduce ( (all, parser) => orElse(all, parser) )

    internalParsers.label = `[many: ${chars}`;
    return zeroOrMore(internalParsers);
}

const pcharA = pchar('a', (char) => char === 'a', '[pchar: a]');
    const pcharB = pchar('b', (char) => char === 'b', '[pchar: b]');
    const pcharC = pchar('c', (char) => char === 'c', '[pchar: c]');
    const pcharE = pchar('e', (char) => char === 'e', '[pchar: e]');


const a_or_b = orElse(pcharA, pcharB);
    const c_or_e = orElse(pcharC, pcharE);
    const a_andThen_b = andThen(pcharA, pcharB);
    const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e);
    Rx.Observable.of(<Result>[false, '', 'ae', undefined])
        .let(a_or_b_andThen_c_or_e)
        .subscribe( 
            (result: Result) => printResult(result),
            (error: Result) => printResult(error)
        );
    // output: [true, 'ae', '']



/* 
    usage: 
    const pcharA = pchar('a', (char) => char === 'a', '[pchar: a]');
    const pcharB = pchar('b', (char) => char === 'b', '[pchar: b]');
    const pcharC = pchar('c', (char) => char === 'c', '[pchar: c]');
    const pcharE = pchar('e', (char) => char === 'e', '[pchar: e]');


    const parser = orElse(pchar('b', (char) => char === 'b', '[pchar: b]'), 
                      pchar('a', (char) => char === 'a', '[pchar: a]'));
    Rx.Observable.of<Result>([false, '', 'ab', undefined])
      .let(parser)
      .subscribe( (result: Result) => printResult(result));
    // output: [pchar: a] true: [a, b]

    const a_or_b = orElse(pchar('a'), pchar('b'));
    const c_or_e = orElse(pchar('c'), pchar('e'));
    const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e);
    Rx.Observable.of(<Response>[undefined, '', 'ae']).let(a_or_b_andThen_c_or_e).subscribe( val => console.log(val));
    // output: [true, 'ae', '']

    const parser = anyOf('abc');
    Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser).subscribe( val => console.log(val));
    [ true, 'a', 'b' ]

    const parser = many('1234567890');
    Rx.Observable.of(<Response>[undefined, '', "780 is my area code"]).let(parser).subscribe( val => console.log(val));
    [ true, '780', ' is my area code' ]

    const stringParser = pstring('blah');
    Rx.Observable.of(<Response>[undefined, '', 'blah']).let(stringParser).subscribe( val => console.log(val));
    [ true, 'blah', '' ]
*/

