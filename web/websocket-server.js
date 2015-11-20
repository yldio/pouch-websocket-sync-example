const http = require('http');
const websocket = require('websocket-stream')
const JsonDuplexStream = require('json-duplex-stream');
const PouchStreamServer = require('pouch-stream-server');
const PouchDB = require('pouchdb');

const pouchServer = PouchStreamServer();
pouchServer.dbs.add('todos-server', new PouchDB('todos-server'));

const server = http.createServer();
const wss = websocket.createServer({server: server}, handle);

server.listen(3001, function() {
    console.log((new Date()) + ' Server is listening on', server.address());
});

function handle(stream) {
  const json = JsonDuplexStream();
  stream.
    pipe(json.in).
    pipe(pouchServer.stream()).
    pipe(json.out).
    pipe(stream);
}

