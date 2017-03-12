import * as Rx from 'rxjs/Rx';
import * as ParserPartOne from '../parser-part-one';
export type MergeLet<T> = (mergeInput$: Rx.Observable<T>) => T;

// reference http://fsharpforfunandprofit.com/posts/understanding-parser-combinators-2/
// lets say we want to implement ParserPartOne.anyOf(...chars)
// we need to a character parser for each character in chars
// and we need a logic structure like this 'pchar c1' or 'prchar c2' or 'pchar c3' ... or 'pchar cn';
// one could look at the problem like this (c1 OR c2) OR (c3 OR c4) ... OR (c_n-1 OR c_n)
// we can combine 'pchar c1' and 'pchar c2' into (c1 OR c2) using a parser combinators
// and then we can reduce all the combinators into one combinator. 
// however, if we want to use Rx to do this operation we typically return an Observable of a ParserCombinator
// we need to resolve this combinator before we can hook it up to the pipeline
export function mergeLet(mergeInput$: Rx.Observable<ParserPartOne.Parser>): (input: Rx.Observable<ParserPartOne.Response>) => Rx.Observable<ParserPartOne.Response> {
    return (input$: Rx.Observable<ParserPartOne.Response>) => {
        return mergeInput$.mergeMap( mergeInput => input$.let(mergeInput))
    }
    
}

export function charRange(chars: string): Rx.Observable<string> {
    const throwUsage = () => Rx.Observable.throw("usage: charRange('a..c')");

    if (typeof chars !== 'string' || chars.length !== 4)
        return throwUsage();

    const [first, , ,last] = chars.split('').map(c => c.charCodeAt(0));

    const diff = last - first > 0 ? last - first + 1 : first - last + 1;


    return Rx.Observable.range(first, diff)
        .filter( code => !(code >= 91 && code <= 96) )
        .map(ascii => String.fromCharCode(ascii))
        .reduce( (str, char) => str + char, '')
        .mergeMap( x => x);
}