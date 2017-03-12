import * as Rx from 'rxjs/Rx';
import * as Utils from '../utilities';
export type ParserCombinator = (parser1: Parser, parser2: Parser) => Parser;
export type Parser = (input$: Rx.Observable<Response>) => Rx.Observable<Response>;
export type Response = [undefined | boolean, string, string];
export type Character = string;
const isCharacter = (data: any): data is Character => typeof data === 'string' && data.length === 1; 

export const pchar = (targetChar: Character): Parser => {

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

export const andThen: ParserCombinator = (parser1, parser2) => {
    return (input$: Rx.Observable<Response>) => {
        return input$
            .let(parser1)
            .let(parser2)
    }
}

export const orElse: ParserCombinator = (parser1, parser2) => {
    
    return (input$: Rx.Observable<Response>) => {
        return input$
            .let(parser1)
            .catch( _ => input$.let(parser2))
    }
}



function run() {
    const sub = {
        next: val => {console.log('------\n'); console.log(val);console.log('------\n'); },
        error: val => {console.log('------\n'); console.log(val);console.log('------\n'); },
    }

    const runs = [
        () => {
            const parser = pchar('a');
            console.log(`parse a from 'a'`)
            return Rx.Observable.of(<Response>[undefined, '', 'a']).let(parser)
        },
        () => {
            const parser = pchar('z');
            console.log(`parse z from 'a'`)
            return Rx.Observable.of(<Response>[undefined, '', 'a']).let(parser)
        },
        () => {
            const parser = andThen(pchar('a'), pchar('b'));
            console.log(`parse "a and then b" from 'ab'`)
            return Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser)
        },
        () => {
            const parser = andThen(pchar('b'), pchar('a'));
            console.log(`parse "b and then a" from 'ab'`)
            return Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser)
        },
        () => {
            const parser = orElse(pchar('b'), pchar('a'));
            console.log(`parse "b or a" from 'ab'`)
            return Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser)
        },
        () => {
            const parser = orElse(pchar('e'), pchar('f'));
            console.log(`parse "a or f" from 'ab'`)
            return Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser)
        },
        () => {
            const a_or_b = orElse(pchar('a'), pchar('b'));
            const c_or_e = orElse(pchar('c'), pchar('e'));
            const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e);
            console.log(`parse " "a or b" and then "c or e" " from 'ae'`)
            return Rx.Observable.of(<Response>[undefined, '', 'ae']).let(a_or_b_andThen_c_or_e);
        },
    ];

    runs.forEach( (run, index) => {
        console.log(`run #${index}`)
        run().subscribe(sub)
    })

}