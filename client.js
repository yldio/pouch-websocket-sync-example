#!/usr/bin/env node

var JSONStream = require('json-duplex-stream');
var Remote = require('pouch-remote-stream');
var PouchDB = require('pouchdb');
var net = require('net');
var _ = require('lodash');

var program = require('commander');
program.
  version(require('./package').version).
  option('-s, --sync <hostname>', 'Sync with server').
  option('-r, --randomwrites', 'Produce random writes on local database').
  parse(process.argv);

var localDB = new PouchDB({
  name: 'localdb',
  db: require('memdown'),
});

console.log('program:', program.sync);

if (program.sync) {
  PouchDB.adapter('remote', Remote.adapter);
  var remote = Remote();
  var remoteDB = new PouchDB({
    name: 'remotedb',
    adapter: 'remote',
    remote: remote,
  });

  var host = program.sync.split(':');
  var conn = net.connect(Number(host[1]), host[0]);
  conn.setEncoding('utf8');
  var json = JSONStream();
  conn.
    pipe(json.in).
    pipe(remote.stream).
    pipe(json.out).
    pipe(conn);


  conn.on('data', console.log);

  var sync = PouchDB.sync(localDB, remoteDB, {live: true});
  sync.on('change', function(ch) {
    console.log('change: %j', ch);
  });
}

if (program.randomwrites) {
  var keys = ['a', 'b', 'c', 'd'];
  console.log('producing random writes');
  setInterval(function() {
    var key = _.sample(keys);
    localDB.get(key, function(err, doc) {
      if (! doc) {
        doc = {_id: key};
      }
      doc.value = Date.now();
      localDB.put(doc, function(err) {
        if (err) {
          console.error(err);
        }
      });
    });
  }, 1000);
}