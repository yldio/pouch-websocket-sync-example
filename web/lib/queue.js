var EventEmitter = require('events').EventEmitter;

export default function Queue(maxConcurrency = 1) {
  var ee = new EventEmitter();
  var q = [];
  var concurrency = 0;

  ee.push = push;
  return ee;

  function push(fn) {
    q.push(fn);
    maybeFlush();
  }

  function maybeFlush() {
    if ((concurrency < maxConcurrency) && q.length) {
      flush();
    }
  }

  function flush() {
    var fn = q.shift();
    if (fn) {
      concurrency ++;
      fn.call(null, done);
    }
  }

  function done(err) {
    concurrency --;
    if (err) {
      ee.emit('error', err);
    }
    maybeFlush();
  }
}