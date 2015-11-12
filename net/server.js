#!/usr/bin/env node

var JSONStream = require('json-duplex-stream');
var PouchStreamServer = require('pouch-stream-server');
var PouchDB = require('pouchdb');
var net = require('net');

var streamServer = PouchStreamServer();
var db = new PouchDB('remotedb', {
  db: require('memdown'),
});
streamServer.dbs.add('remotedb', db);

var server = net.createServer(function(conn) {
  console.log('new connection from %j', conn.remoteAddress);
  var json = JSONStream();
  var dbStream = streamServer.stream();

  conn.setEncoding('utf8');
  conn.on('data', console.log);

  conn.
    pipe(json.in).
    pipe(dbStream).
    pipe(json.out).
    pipe(conn);

});

server.listen(4321, function() {
  console.error('pouchdb stream server listening to %j', server.address());
});