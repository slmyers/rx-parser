import * as Rx from 'rxjs/Rx';
type ParserCombinator = (parser1: Parser, parser2: Parser) => Parser;
type Parser = (input$: Rx.Observable<Response>) => Rx.Observable<Response>;
type Response = [undefined | boolean, string, string];
type Character = string;
const isCharacter = (data: any): data is Character => typeof data === 'string' && data.length === 1; 

const pchar = (targetChar: Character): Parser => {

    return (input$: Rx.Observable<Response>): Rx.Observable<Response> => {
        return input$
            .filter( ([, , s]) => s.length > 0)
            .mergeMap(resp => {
                const [ , progress, str ] = resp
                const [car, cdr] = [ str[0], str.substr(1, str.length - 1) ]

                return Rx.Observable.if( () => car === targetChar, 
                    Rx.Observable.of([true, progress + car , cdr]), 
                    Rx.Observable.throw([false, progress, str])
                )
            })
    }
}

const andThen: ParserCombinator = (parser1, parser2) => {
    
    return (input$: Rx.Observable<Response>) => {
        return input$
            .let(parser1)
            .let(parser2)
    }
}

const orElse: ParserCombinator = (parser1, parser2) => {

    return (input$: Rx.Observable<Response>) => {
        return input$
            .let(parser1)
            .catch( _ => input$.let(parser2))
    }
}

const anyOf = (chars: string) => {
    return chars.split('')
                .map( char => pchar(char))
                .reduce( (all, parser) => all === undefined ? parser : orElse(all, parser));
}

const pstring = (chars: string) => {
    return chars.split('')
                .map( char => pchar(char))
                .reduce( (all, parser) => all === undefined ? parser : andThen(all, parser));
}

const zeroOrMore = (parser1) => {
    return (input$: Rx.Observable<Response>) => {
        return input$
                .expand( response => Rx.Observable.of(response).let(parser1))
                .last()
                .catch(err => Rx.Observable.of(err).map( ([res, progress, curr]) => [true, progress, curr]));
    }
}

const many = (chars: string) => {
    const internalParsers =  chars.split('')
                .map(char => pchar(char))
                .reduce ( (all, parser) => all === undefined ? parser : orElse(all, parser) )

    return zeroOrMore(internalParsers);
}



/* 
    usage: 

    const parser = orElse(pchar('b'), pchar('a'));
    Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser).subscribe( val => console.log(val));
    [true, 'a', 'b']

    const a_or_b = orElse(pchar('a'), pchar('b'));
    const c_or_e = orElse(pchar('c'), pchar('e'));
    const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e);
    Rx.Observable.of(<Response>[undefined, '', 'ae']).let(a_or_b_andThen_c_or_e).subscribe( val => console.log(val));
    [true, 'ae', '']

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