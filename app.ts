import * as Rx from 'rxjs/Rx';
type ParserCombinator = (parser1: Parser, parser2: Parser, label: string) => Parser;
type Parser = (input$: Rx.Observable<Response>) => Rx.Observable<Response>;
// [ label, success, progress, current ]
type Response = [ string, boolean, string, string ];
type Character = string;
const isCharacter = (data: any): data is Character => typeof data === 'string' && data.length === 1; 

const satisfy = (predicate: (thing: any) => boolean, label: string): Parser => {

    return (input$: Rx.Observable<Response>): Rx.Observable<Response> => {
        return input$
            .filter( ([, , , s]) => s.length > 0)
            .mergeMap(resp => {
                const [ , , progress, str ] = resp
                const [car, cdr] = [ str[0], str.substr(1, str.length - 1) ]
                return Rx.Observable.if( () => predicate(car), 
                    Rx.Observable.of([label, true, progress + car , cdr]), 
                    Rx.Observable.throw([label, false, progress, str])
                )
            })
    }
}

const andThen: ParserCombinator = (parser1, parser2, label) => {
    
    return (input$: Rx.Observable<Response>) => {
        return input$
            .let(parser1)
            .map( ([internalLabel, ...rest]) => [label, ...rest])
            .let(parser2)
            .map( ([internalLabel, ...rest]) => [label, ...rest])
            .catch( err => {
                const [ , success, progress, current ] = err;
                return Rx.Observable.throw([ label, success, progress, current ]);
            })
    }
}

const orElse: ParserCombinator = (parser1, parser2, label) => {

    return (input$: Rx.Observable<Response>) => {

        return input$
            .let(parser1)
            .map( ([internalLabel, ...rest]) => [label, ...rest])
            .catch( _ => {
                return input$.let(parser2).map( ([internalLabel, ...rest]) => [label, ...rest]).catch( err => {
                    const [ , success, progress, current ] = err;
                    return Rx.Observable.throw([ label, success, progress, current]);
                });
            })
    }
}

const anyOf = (chars: string) => {
    return chars.split('')
                .map( char => satisfy((car) => car === char, `[pchar: ${char}]`))
                .reduce( (all, parser) => all === undefined ? parser : orElse(all, parser, `[anyOf: ${chars}]`));
}

const pstring = (chars: string) => {
    return chars.split('')
                .map( char => satisfy((car) => car === char, `[pchar: ${char}]`))
                .reduce( (all, parser) => all === undefined ? parser : andThen(all, parser, `[pstring: ${chars}]`));
}

const zeroOrMore = (parser1, chars) => {
    return (input$: Rx.Observable<Response>) => {

        return input$
                .expand( response => Rx.Observable.of(response).let(parser1))
                .last()
                .catch(
                    err => Rx.Observable.of(err).map( ([ , res, progress, curr]) => [ `[zeroOrMore: ${chars}`, true, progress, curr])
                );
    }
}

const many = (chars: string) => {
    const internalParsers =  chars.split('')
                .map( char => satisfy((car) => car === char, `[pchar: ${char}]`))
                .reduce ( (all, parser) => all === undefined ? parser : orElse(all, parser, `[many: ${chars}]`) );

    return zeroOrMore(internalParsers, `many: ${chars}`);
}

/* 

    const logFn = _ => console.log(_)
    const pchar_a = satisfy( car => car === 'a', `[pchar: a]`);
    const pchar_b = satisfy( car => car === 'b', `[pchar: b]`);
    const pchar_c = satisfy( car => car === 'c', `[pchar: c]`);
    const pchar_e = satisfy( car => car === 'e', `[pchar: e]`);
    usage: 

    const parser = orElse(pchar_b, pchar_a, `[orElse: a, b]`);
    Rx.Observable.of(<Response>['', false, '', 'ab']).let(parser).subscribe(logFn);
    [ '[orElse: a, b]', true, 'a', 'b' ]

    const parser = andThen(pchar('a', `[pchar: a]`), pchar('b', `[pchar: b]`), `[andThen: a, b]`);
    Rx.Observable.of(<Response>['', false, '', 'ab']).let(parser).subscribe(logFn);
    [ '[andThen: a, b]', true, 'ab', '' ]

    const a_or_b = orElse(pchar_a, pchar_b, `[orElse: a, b]`);
    const c_or_e = orElse(pchar_c, pchar_e, `[orElse: c, e]`);
    const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e, `[andThen: a-or-else-b, c-or-else-e]`);
    Rx.Observable.of(<Response>['', false, '', 'ae']).let(a_or_b_andThen_c_or_e).subscribe(logFn);
    [ '[andThen: a-or-else-b, c-or-else-e]', true, 'ae', '' ]

    const parser = anyOf('abc');
    Rx.Observable.of(<Response>['', false, '', 'ab']).let(parser).subscribe(logFn);
    [ '[anyOf: abc]', true, 'a', 'b' ]

    const parser = many('1234567890');
    Rx.Observable.of(<Response>['', false, '', "780 is my area code"]).let(parser).subscribe(logFn, logFn);
    [ '[zeroOrMore: many: 1234567890',
    true,
    '780',
    ' is my area code' ]

    const stringParser = pstring('blah');
    Rx.Observable.of(<Response>['', false, '', 'blah']).let(stringParser).subscribe(logFn);
    [ '[pstring: blah]', true, 'blah', '' ]
*/