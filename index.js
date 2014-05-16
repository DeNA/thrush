'use strict';

/**
 * This is [Bluebird](https://github.com/petkaantonov/bluebird), with extra
 * class methods defined here. See the
 * [Bluebird API docs](https://github.com/petkaantonov/bluebird/blob/master/API.md)
 * for more info.
 *
 * @class
 * @name Promise
 */
var Promise = require('./bluebird-stub');

/** @private */
function defaultSeriesIterator(elem, x) {
    return typeof elem === 'function' ? elem(x) : Promise.resolve(elem);
}

/**
 * Similar to `async.series/eachSeries`.
 *
 * This operates something like `Promise.all`, except order is guaranteed, and
 * upon the first rejection/error, execution stops.
 *
 * <u>Using with an iterator:</u>
 *
 * Pass in an array of objects to iterate over, and an iterator function.
 * The iterator is like a `then` function, except the first param the
 * element being iterated, and the second is the resolved value from the
 * previous `then` block. You can return a value or a promise of a value,
 * and it will be passed to the next iteration as `x`.
 *
 * <u> Using without an iterator:</u>
 *
 * Each array element is assumed to be a function with the same signature as an
 * iterator function would in the previous case. If the array element is not a
 * function, the value is simply passed along to the next array element (which
 * is hopefully a function) as the resolved value.
 *
 * @memberof! Promise
 * @param {array} arr The array to iterate over.
 * @param {iterator} iterator optional iterator function. Takes in current
 * object (`elem`) and previously resolved object(`x`).
 * @return {Promise}
 */
Promise.series = Promise$series;

Promise.prototype.series = function(iterator){
    return this.then(function(arr){
        return Promise$series(arr, iterator);
    });
}

function Promise$series(arr, iterator){
    iterator = iterator || defaultSeriesIterator;
    var p = Promise.resolve(), curr;
    function addIteration(curr) {
        p = p.then(function(x){ return iterator(curr, x); });
    }
    for (var i = 0, len = arr.length; i < len; i++) {
        addIteration(arr[i]);
    }
    return p;
}

/**
 * Similar to `async.whilst`.
 *
 * `action` will be executed repeatedly, as if with `Promise.series`, until
 * `condition` returns false, and then the promise will resolve. This will
 * reject if `action` returns a promise that rejects, or if an error is
 * thrown anywhere.
 *
 * @memberof! Promise
 * @param {function} condition returns a boolean: whether or not to continue
 * @param {function} action runs for each iteration
 * @return {Promise}
 */
Promise.whilst = function Promise$whilst(condition, action) {
    function loop() {
        if (!condition()) { return; }
        return Promise.method(action)().then(loop);
    };
    return Promise.method(loop)();
};

/**
 * Like Promise.promisify(func, thisObj), except it also works on functions
 * that already return a promise, or return a nodeified promise.
 *
 * The function passed in must do **exactly** one of the following:
 *
 * 1. Return a promise.
 * 2. Call a callback.
 * 3. Return a promise that's "nodeified".
 *
 * If you pass a synchronous function in, it won't work. If your function
 * returns a value that isn't a promise, you'll never have access to that value.
 *
 * If you pass a 3rd parameter in and it is truthy, the func will be wrapped in
 * a domain, so that any errors thrown deep in the callback chain will be caught
 * and rejected. This is not recommended in general cases, since it's a burden
 * on performance.
 *
 * @memberof! Promise
 * @param {function} func The function to promisify
 * @param {object} thisObj An optional object to bind the function to.
 * @param {boolean} inDomain An optional boolean whether to wrap func in domain.
 * @return {function} Promisified version of func.
 */
Promise.safelyPromisify = function Promise$safelyPromisify(func, thisObj, inDomain) {
    return function() {
        var args = Array.prototype.slice.call(arguments);
        if (!thisObj && this) { thisObj = this; }
        return new Promise(function(resolve, reject){
            var d;
            if (inDomain) {
                d = require('domain').create();
                d.on('error', reject);
                d.enter();
            }
            args.push(function(err, result){
                if (d) { d.exit(); }
                if (err) { reject(err); }
                else { resolve(result); }
            });
            var p = func.apply(thisObj, args);
            if (d) { d.exit(); }
            if (p && p.then) { resolve(p); }
        });
    };
};

/**
 * Similar to `nodeify`, except it works with arrays. The idea here is to support
 * nodeifying promises that resolve arrays, in a manner similar to `spread`.
 *
 * If the callback is missing, this will simply return the promise.
 *
 * If the callback is not a function, this will throw a TypeError.
 *
 * If the promise does not resolve an array, a TypeError will be resolved (or
 * passed to the callback if available).
 *
 * @example
 * function arrayThing(cb) {
 *     // will return promise if no cb, or call cb if it's there.
 *     Promise.resolve([1,2,3]).spreadNodeify(function(err, one, two, three){
 *         if (err) return cb(err);
 *         assert.equal(one, 1);
 *         assert.equal(two, 2);
 *         assert.equal(three, 3);
 *         cb();
 *     });
 * }
 * @memberof! Promise.prototype
 * @param {function} cb Callback (can be falsy)
 * @return {Promise} undefined if a callback is provided
 */
Promise.prototype.spreadNodeify = function Promise_spreadNodeify(cb) {
    if (!cb) { return this; }

    if (cb && typeof cb !== 'function') {
        throw new TypeError('[Promise#spreadNodeify] callback is not a function');
    }

    this.then(function (arr) {
        if (!Array.isArray(arr)) {
            throw new TypeError('[Promise#spreadNodeify] promise does not resolve an array');
        }

        arr.unshift(null);
        return arr;
    }).spread(cb).catch(cb);
};

/**
 * Similar to `async.parallel`.
 *
 * Shortcut to `Promise.all(arr.map(function(x) { return x(); }));`
 *
 * @param {array} arr Array of functions that return promises
 * @return {Promise}
 */
Promise.invokeAll = function Promise$mapAll(arr) {
    var i = arr.length, mapped = new Array(i), x;
    while (i--) {
        x = arr[i]();
        if (!x || typeof x.then !== 'function') {
            return Promise.reject(new Error('[Promise_invokeAll] arr['+i+'] did not return a promise'));
        }
        mapped[i] = x;
    }
    return Promise.all(mapped);
}

module.exports = Promise;
