# pouch-websocket-sync-example

Examples of using (pouch-stream-server)[https://github.com/pgte/pouch-stream-server#readme] and [pouch-remote-stream](https://github.com/pgte/pouch-remote-stream#readme).

## Install

To use these examples you should use git to clone this repo:

```
$ git clone git@github.com:pgte/pouch-stream-example.git
$ cd pouch-stream-example
```

## TCP example

### 1. Start the TCP server:

```
$ net/server.js
pouchdb stream server listening to {"address":"::","family":"IPv6","port":4321}
```

### 2. Start a client

You can now start a client that syncs with the server and emits random writes:

```
$ net/client.js -s localhost:4321 -r
```

The client should start doing local random writes that get synced ti the server

### 3. Start another client

You can now start another client that will sync with the server:

```
$ net/client.js -s localhost:4321
```
