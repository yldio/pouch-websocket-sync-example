const http = require('http');
const websocket = require('websocket-stream')
const PouchStreamServer = require('pouch-stream-server');
const PouchDB = require('pouchdb');
const PipeChannels = require('pipe-channels');

const server = http.createServer();
const wss = websocket.createServer({server: server}, handle);

const db = new PouchDB('todos-server');
const allowedDatabases = ['todos-server'];

server.listen(3001, function() {
  console.log((new Date()) + ' Server is listening on', server.address());
});

function handle(stream) {
  const channelServer = PipeChannels.createServer();
  const pouchServer = PouchStreamServer();
  pouchServer.dbs.add('todos-server', db);

  channelServer.on('request', function(req) {
    if (allowedDatabases.indexOf(req.payload.database) >= 0) {
      req.deny('database not allowed');
    } else {
      const channel = req.grant();
      channel.on('error', warn);
      channel.pipe(pouchServer.stream()).pipe(channel);
    }
  });

  stream.on('error', warn);
  stream.pipe(channelServer).pipe(stream);
}

function warn(err) {
  console.error(err.stack || err.message || err);
}