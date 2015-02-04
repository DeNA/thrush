'use strict';

var Promise = require('../index');
var assert = require('assert');

describe('Promise', function(){
    it('should not pollute bluebird', function(){
        assert(Promise.whilst);
        assert(Promise.series);
        assert(!require('bluebird').whilst);
        assert(!require('bluebird').series);
    });

    describe('.whilst', function(){
        it('should operate correctly', function(){
            var result = [], counter = 0;
            return Promise.whilst(function(){
                return result.length < 7;
            }, function(){
                result.push(counter++);
            }).then(function(){
                assert.equal(counter, 7);
                assert.deepEqual(result, [0,1,2,3,4,5,6]);
            });
        });

        it('should operate correctly with action returning a promise', function(){
            var result = [], counter = 0;
            return Promise.whilst(function(){
                return result.length < 7;
            }, function(){
                return Promise.method(function(){
                    result.push(counter++);
                })();
            }).then(function(){
                assert.equal(counter, 7);
                assert.deepEqual(result, [0,1,2,3,4,5,6]);
            });
        });

        it('should stop on error', function(){
            var result = [], counter = 0;
            return Promise.whilst(function(){
                return true;
            }, function(){
                return Promise.method(function(){
                    if (counter === 7) {
                        throw new Error('BAAD');
                    }
                    result.push(counter++);
                })();
            }).catch(function(e){
                assert.equal(e.message, 'BAAD');
                assert.equal(counter, 7);
                assert.deepEqual(result, [0,1,2,3,4,5,6]);
            });
        });
    });

    describe('.series with iterator', function(){
        it('should operate correctly', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.series(orig, function(elem){
                result.push(elem);
            }).then(function(){
                assert.deepEqual(result, orig);
            })
        });

        it('should operate correctly returning a promise', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.series(orig, function(elem){
                return Promise.resolve().then(function(){
                    result.push(elem);
                });
            }).then(function(){
                assert.deepEqual(result, orig);
            });
        });

        describe('should not execute after the first error', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.series(orig, function(elem){
                    if (elem === limit) {
                        throw new Error('BAAAAAD');
                    }
                    result.push(elem);
                }).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        describe('should not execute after the first error returning promises', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.series(orig, function(elem){
                    return Promise.resolve().then(function(){
                        if (elem === limit) {
                            throw new Error('BAAAAAD');
                        }
                        result.push(elem);
                    });
                }).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        it('should operate with a delayed Promise iterator', function() {
            return Promise.series([0,1,2,3,4], function(current, total) {
                return Promise.delay(0).then(function() {
                    return (total || 0) + (current + 5);
                });
            }).then(function(value) {
                assert.equal(value, 0+5 + 1+5 + 2+5 + 3+5 + 4+5);
            });
        });
    });

    describe('.series without iterator', function(){
        it('should operate correctly', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.series(orig.map(function(elem){
                if (elem === 0) {
                    return elem; // testing non-func case
                }
                return function(x){
                    if (elem === 1) {
                        assert.equal(x, 0); // make sure promise values get passed along
                    }
                    result.push(elem);
                };
            })).then(function(){
                assert.deepEqual(result, [1,2,3,4]); // no result.push() for 0
            });
        });

        it('should operate correctly returning a promise', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.series(orig.map(function(elem){
                return function(){
                    return Promise.resolve().then(function(){
                        result.push(elem);
                    });
                };
            })).then(function(){
                assert.deepEqual(result, orig);
            });
        });

        describe('should not execute after the first error', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.series(orig.map(function(elem){
                    return function(){
                        if (elem === limit) {
                            throw new Error('BAAAAAD');
                        }
                        result.push(elem);
                    };
                })).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        describe('should not execute after the first error returning promises', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.series(orig.map(function(elem){
                    return function(){
                        return Promise.resolve().then(function(){
                            if (elem === limit) {
                                throw new Error('BAAAAAD');
                            }
                            result.push(elem);
                        });
                    };
                })).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 0; i < 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        it('should operate with delayed Promise values', function() {
            function promising(current, delay) {
                return function(total) {
                    return Promise.delay(delay).then(function() {
                        return (total || 0) + (current + 5);
                    })
                };
            };
            return Promise.series([
                promising(0, 50),
                promising(1, 30),
                promising(2, 10),
                promising(3, 30),
                promising(4, 50),
            ]).then(function(value) {
                assert.equal(value, 0+5 + 1+5 + 2+5 + 3+5 + 4+5);
            });
        });
    });

    describe('#series with iterator', function(){
        it('should operate correctly', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.resolve(orig).series(function(elem){
                result.push(elem);
            }).then(function(){
                assert.deepEqual(result, orig);
            });
        });

        it('should operate correctly returning a promise', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.resolve(orig).series(function(elem){
                return Promise.resolve().then(function(){
                    result.push(elem);
                });
            }).then(function(){
                assert.deepEqual(result, orig);
            });
        });

        describe('should not execute after the first error', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.resolve(orig).series(function(elem){
                    if (elem === limit) {
                        throw new Error('BAAAAAD');
                    }
                    result.push(elem);
                }).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        describe('should not execute after the first error returning promises', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.resolve(orig).series(function(elem){
                    return Promise.resolve().then(function(){
                        if (elem === limit) {
                            throw new Error('BAAAAAD');
                        }
                        result.push(elem);
                    });
                }).catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        it('should operate with a delayed Promise iterator', function() {
            return Promise.resolve([0,1,2,3,4]).series(function(current, total) {
                return Promise.delay(0).then(function() {
                    return (total || 0) + (current + 5);
                });
            }).then(function(value) {
                assert.equal(value, 0+5 + 1+5 + 2+5 + 3+5 + 4+5);
            });
        });
    });

    describe('#series without iterator', function(){
        it('should operate correctly', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.resolve(orig.map(function(elem){
                if (elem === 0) {
                    return elem; // testing non-func case
                }
                return function(x){
                    if (elem === 1) {
                        assert.equal(x, 0); // make sure promise values get passed along
                    }
                    result.push(elem);
                };
            })).series().then(function(){
                assert.deepEqual(result, [1,2,3,4]); // no result.push() for 0
            });
        });

        it('should operate correctly returning a promise', function(){
            var result = [], orig = [0,1,2,3,4];
            return Promise.resolve(orig.map(function(elem){
                return function(){
                    return Promise.resolve().then(function(){
                        result.push(elem);
                    });
                };
            })).series().then(function(){
                assert.deepEqual(result, orig);
            });
        });

        describe('should not execute after the first error', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.resolve(orig.map(function(elem){
                    return function(){
                        if (elem === limit) {
                            throw new Error('BAAAAAD');
                        }
                        result.push(elem);
                    };
                })).series().catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 1; i <= 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        describe('should not execute after the first error returning promises', function(){
            function test(){
                var result = [], orig = [0,1,2,3,4];
                var limit = 1+Math.floor(Math.random()*3);
                return Promise.resolve(orig.map(function(elem){
                    return function(){
                        return Promise.resolve().then(function(){
                            if (elem === limit) {
                                throw new Error('BAAAAAD');
                            }
                            result.push(elem);
                        });
                    };
                })).series().catch(function(err){
                    assert.equal(err.message, 'BAAAAAD');
                    assert.equal(result.length, limit);
                    for (var i = 0; i < limit; i++) {
                        assert.equal(result[i], i);
                    }
                });
            }
            for (var i = 0; i < 5; i++) { // do it several times since we're randomizing the error element
                it('trial '+i, test);
            }
        });

        it('should operate with delayed Promise values', function() {
            function promising(current, delay) {
                return function(total) {
                    return Promise.delay(delay).then(function() {
                        return (total || 0) + (current + 5);
                    })
                };
            };
            return Promise.resolve([
                promising(0, 50),
                promising(1, 30),
                promising(2, 10),
                promising(3, 30),
                promising(4, 50),
            ]).series().then(function(value) {
                assert.equal(value, 0+5 + 1+5 + 2+5 + 3+5 + 4+5);
            });
        });
    });

    // we're asserting this behavior since we require it, and it used to be unsupported
    describe('#nodeify', function() {
        it('receives a result', function(done) {
            Promise.resolve(1).nodeify(function(err, result) {
                assert.equal(2, arguments.length);
                assert.ifError(err);
                assert.equal(1, result);
                done();
            });
        });
        it('receives no result', function(done) {
            Promise.resolve().nodeify(function(err, result) {
                assert.equal(1, arguments.length);
                assert.ifError(err);
                assert.strictEqual(undefined, result);
                done();
            });
        });
        it('receives an Error', function(done) {
            var error = new Error('BOOM');
            Promise.reject(error).nodeify(function(err) {
                assert(err);
                assert.equal(error.message, err.message);
                done();
            });
        });
        it('always returns a Promise', function() {
            var returned;

            // with a callback
            returned = Promise.resolve().nodeify(function() {});
            assert(returned instanceof Promise);

            // without a callback
            returned = Promise.resolve().nodeify();
            assert(returned instanceof Promise);
        });
    });

    describe('.safelyPromisify', function(){
        var callbackish, promiseish, nodeified, asyncThrow, error;
        before(function(){
            error = new Error('safelyPromisify error');
            callbackish = function (shouldErr, cb){
                var self = this;
                setImmediate(function(){
                    if (shouldErr) { cb(error); }
                    else {
                        var r = (self && self.result) ? self.result : 'result';
                        cb(null, r);
                    }
                });
            };

            asyncThrow = function (cb) {
                // jshint unused: false
                setImmediate(function(){
                    throw error;
                });
            };

            promiseish = function (shouldErr){
                if (shouldErr) { return Promise.reject(error); }
                else { return Promise.resolve((this && this.result) ? this.result : 'result'); }
            };

            nodeified = function (shouldErr, cb) {
                return promiseish.call(this, shouldErr).nodeify(cb);
            };

        });
        afterEach(function(){
            if (process.domain) {
                process.domain.exit();
            }
        });
        it('should promisify a callback function', function(){
            var safe = Promise.safelyPromisify(callbackish);
            var safeBound = Promise.safelyPromisify(callbackish, {result: 123});
            var safeDomain = Promise.safelyPromisify(callbackish, {result: 123}, true);
            return safe(false).then(function(result){
                assert.equal(result, 'result');
                return safe(true);
            }).catch(function(err){
                assert.deepEqual(err, error);
                return safeBound(false);
            }).then(function(result){
                assert.equal(result, 123);
                return safeDomain(false);
            }).then(function(result){
                assert.equal(result, 123);
                return safe.call({result: 456}, false);
            }).then(function(result){
                assert.equal(result, 456);
            });
        });
        it('should promisify a promiseish function', function(){
            var safe = Promise.safelyPromisify(promiseish);
            var safeBound = Promise.safelyPromisify(promiseish, {result: 123});
            return safe(false).then(function(result){
                assert.equal(result, 'result');
                return safe(true);
            }).catch(function(err){
                assert.deepEqual(err, error);
                return safeBound(false);
            }).then(function(result){
                assert.equal(result, 123);
                return safe.call({result: 456}, false);
            }).then(function(result){
                assert.equal(result, 456);
            });
        });
        it('should promisify a nodeified function', function(){
            var safe = Promise.safelyPromisify(nodeified);
            var safeBound = Promise.safelyPromisify(nodeified, {result: 123});
            return safe(false).then(function(result){
                assert.equal(result, 'result');
                return safe(true);
            }).catch(function(err){
                assert.deepEqual(err, error);
                return safeBound(false);
            }).then(function(result){
                assert.equal(result, 123);
                return safe.call({result: 456}, false);
            }).then(function(result){
                assert.equal(result, 456);
            });
        });
        it('should deal with async throws if inDomain', function(done){
            var safe = Promise.safelyPromisify(asyncThrow, null, true);
            var d = require('domain').create();
            d.on('error', function() {
                d.exit();
                done(new Error('should have been caught by promise!'));
            });
            d.run(function(){
                safe().catch(function(err){
                    assert.deepEqual(err, error);
                    d.exit();
                }).done(done);
            });
        });
        it('should not deal with async throws if not inDomain', function(done){
            var safe = Promise.safelyPromisify(asyncThrow);
            var d = require('domain').create();
            d.on('error', function(err) {
                assert.deepEqual(err, error);
                d.exit();
                done();
            });
            d.run(function(){
                safe().catch(function(){
                    d.exit();
                    done(new Error('should have been caught by domain!'));
                });
            });
        });
        it('should exit domain only after promise chain has unravelled', function(done){
            assert(!process.domain);
            var ran = false;
            Promise.safelyPromisify(function(){
                return Promise.resolve().then(function(){
                    assert(process.domain);
                    ran = true;
                });
            }, null, true)();
            setImmediate(function(){
                assert(ran);
                assert(!process.domain);
                done();
            });
        });
    });

    describe('#spreadNodeify', function() {
        it('should call the callback appropriately', function(done){
            Promise.resolve([1,2,3,'1','b','c']).spreadNodeify(function(){
                try {
                    assert.deepEqual([].slice.call(arguments), [null, 1,2,3,'1','b','c']);
                } catch(e) { return done(e); }
                done();
            });
        });
        it('should pass rejections to the callback', function(done){
            var error = new Error('bad');
            Promise.reject(error).spreadNodeify(function(err){
                try {
                    assert.equal(arguments.length, 1);
                    assert.equal(err.message, 'bad');
                } catch(e) { return done(e); }
                done();
            });
        });
        it('should return the promise if no callback', function(){
            var p = Promise.resolve([1,2,3,'1','b','c']);
            var q = p.spreadNodeify();
            assert.strictEqual(p, q);
        });
    });

    describe('.invokeAll', function(){
        it('should execute the functions returning promises', function(){
            function p() { return Promise.resolve(1) }
            return Promise.invokeAll([p,p,p,p]).then(function(result){
                assert.deepEqual(result, [1,1,1,1]);
            });
        });

        it('should reject if any of the functions do not return a promise', function() {
            function p() { return Promise.resolve(1) }
            function q() { return 1; }
            return Promise.invokeAll([p,p,q,p]).catch(function(e){
                assert(e.message.match(/did not return a promise/));
            });
        });
    });
});
