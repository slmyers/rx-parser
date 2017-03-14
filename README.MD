This is a simple parser written in [rxjs](https://github.com/ReactiveX/rxjs). It mostly follows along with [this](https://fsharpforfunandprofit.com/series/understanding-parser-combinators.html) wonderful blog series from Scott Wlaschin.
While the parser in his blog series was written in `f#` and was ~500 lines this smaller parser finished in at 70 lines with 6 lines being import and type declarations. However, to be fair, I haven't followed along with the series in a 1-to-1 manner and may not have implemented all of the functions in the original series. I still feel there is a point to be made.

# example

```js
const log = (val) => console.log(val);

const parser = orElse(pchar('b'), pchar('a'));
Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser).subscribe(log);
//[true, 'a', 'b']

const a_or_b = orElse(pchar('a'), pchar('b'));
const c_or_e = orElse(pchar('c'), pchar('e'));
const a_or_b_andThen_c_or_e = andThen(a_or_b, c_or_e);
Rx.Observable.of(<Response>[undefined, '', 'ae']).let(a_or_b_andThen_c_or_e).subscribe(log);
//[true, 'ae', '']

const parser = anyOf('abc');
Rx.Observable.of(<Response>[undefined, '', 'ab']).let(parser).subscribe(log);
//[ true, 'a', 'b' ]

const parser = many('1234567890');
Rx.Observable.of(<Response>[undefined, '', "780 is my area code"]).let(parser).subscribe(log);
//[ true, '780', ' is my area code' ]

const stringParser = pstring('blah');
Rx.Observable.of(<Response>[undefined, '', 'blah']).let(stringParser).subscribe(log);
//[ true, 'blah', '' ]
```

