
# Thrush

> ![Swainson's Thrushes](http://www.allaboutbirds.org/guide/PHOTO/LARGE/swain.jpg)
>
> A [**Thrush**](http://en.wikipedia.org/wiki/Thrush_(bird) is any member of the *Turdidae* family, which includes robins, bluebird, blackbirds and other small birds.

**Thrush** is a set of addon functions for [Bluebird](https://github.com/petkaantonov/bluebird). The intention is to make it easier for people coming from libraries like [async.js](https://github.com/caolan/async).

Thrush is intended for use with Node.js v0.10.26+. Usage with earlier versions of Node.js, or in other JavaScript environments, is not yet supported.

Thrush includes Bluebird, so all you need to do is something like this:

```javascript
var Promise = require('thrush');
```

And you're good to go. Thrush is non-destructive, so you can still use Bluebird on its own if you don't want Thrush's additions elswhere in your code.

[Bluebird's API docs](https://github.com/petkaantonov/bluebird/blob/master/API.md) describe most of the API that Thrush provides. The rest is documented here, and as jsdoc in the code.

## API

##### `Promise.safelyPromisify(Function func, [dynamic thisObj], [boolean inDomain])` -> `Function`

Like [`Promise.promisify(func, thisObj)`](https://github.com/petkaantonov/bluebird/blob/master/API.md#promisepromisifyfunction-nodefunction--dynamic-receiver---function), except it also works on functions that already return a promise, or return a nodeified promise.
 
The function passed in must do **exactly** one of the following:
 
1. Return a promise.
2. Call a callback.
3. Return a promise that's "nodeified".
 
If you pass a synchronous function in, it won't work. If your function returns a value that isn't a promise, you'll never have access to that value.

If you pass a 3rd parameter in and it is truthy, the func will be wrapped in a domain, so that any errors thrown deep in the callback chain will be caught and rejected. This is not recommended in general cases, since it's a burden on performance.

----------
 
##### `Promise.series(Array arr, [Function iterator])` -> `Promise`

Similar to [`async.series`](https://github.com/caolan/async#seriestasks-callback)/[`each`](https://github.com/caolan/async#eachSeries).

This operates something like `Promise.all`, except order is guaranteed, and upon the first rejection/error, execution stops.

<u>Using with an iterator:</u>

Pass in an array of objects to iterate over, and an iterator function. The iterator is like a `then` function, except the first param the element being iterated, and the second is the resolved value from the previous `then` block. You can return a value or a promise of a value, and it will be passed to the next iteration as `x`.

<u> Using without an iterator:</u>

Each array element is assumed to be a function with the same signature as an iterator function would in the previous case. If the array element is not a function, the value is simply passed along to the next array element (which is hopefully a function) as the resolved value.

----------

##### `.series([Function iterator])` -> `Promise`

This is the same as [`Promise.series`](#promiseseriesarray-arr-function-iterator---promise), but operates on an array resolved by promise this is being called on.

----------

##### `Promise.invokeAll(Array arr)` -> `Promise`

Similar to [`async.parallel`](https://github.com/caolan/async#parallel). Shortcut to `Promise.all(arr.map(function(x) { return x(); }));`

----------

##### `Promise.whilst(Function condition, Function action)` -> `Promise`

Similar to [`async.whilst`](https://github.com/caolan/async#whilst).

`action` will be executed repeatedly, as if with [`Promise.series`](#series), until `condition` returns false, and then the promise will resolve. This will reject if `action` returns a promise that rejects, or if an error is thrown anywhere.

----------

##### `.spreadNodefiy([Function cb])` -> `Promise`

Similar to [`nodeify`](https://github.com/petkaantonov/bluebird/blob/master/API.md#nodeifyfunction-callback---promise), except it works with arrays. The idea here is to support nodeifying promises that resolve arrays, in a manner similar to [`spread`](https://github.com/petkaantonov/bluebird/blob/master/API.md#spreadfunction-fulfilledhandler--function-rejectedhandler----promise).

If the callback is missing, this will simply return the promise.

If the callback is not a function, this will throw a TypeError.

If the promise does not resolve an array, a TypeError will be resolved (or passed to the callback if available).

Example:

```javascript
// will return promise if no cb, or call cb if it's there.
Promise.resolve([1,2,3]).spreadNodeify(function(err, one, two, three){
    if (err) return cb(err);
    assert.equal(one, 1);
    assert.equal(two, 2);
    assert.equal(three, 3);
    cb();
});
```

----------


## LICENSE

The MIT License (MIT)

Copyright (c) 2014 DeNA Co., Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
