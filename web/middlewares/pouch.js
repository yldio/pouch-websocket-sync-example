import jPath from 'json-path';
import Queue from '../lib/queue';
import extend from 'xtend';
import equal from 'deep-equal'

export default function createPouchMiddleware(_paths = []) {
  let paths = _paths;
  if (!Array.isArray(paths)) {
    paths = [paths];
  }

  if (!paths.length) {
    throw new Error('PouchMiddleware: no paths');
  }

  const defaultSpec = {
    path: '.',
    remove: scheduleRemove,
    insert: scheduleInsert,
    propagateDelete,
    propagateUpdate,
    propagateInsert,
    queue: Queue(1),
    docs: {},
    actions: {
      remove: defaultAction('remove'),
      update: defaultAction('update'),
      insert: defaultAction('insert')
    }
  }

  paths = paths.map(function(path) {
    const spec = extend({}, defaultSpec, path);
    spec.actions = extend({}, defaultSpec.actions, spec.actions);

    if (! spec.db) {
      throw new Error('path ' + path.pth + ' needs a db:')
    }
    return spec;
  });

  function listen(path) {
    const changes = path.db.changes({live: true, include_docs: true});
    changes.on('change', change => onDbChange(path, change));
  }

  function processNewStateForPath(path, state) {
    var docs = jPath.resolve(state, path.path);
    if (docs && docs.length) {
      let diffs = differences(path.docs, docs[0]);
      diffs.new.concat(diffs.updated).forEach(doc => path.insert(doc))
      diffs.deleted.forEach(doc => path.remove(doc));
    }
  }

  function scheduleInsert(doc) {
    var db = this.db;
    this.queue.push(function(cb) {
      db.put(doc, cb);
    });
  }

  function scheduleRemove(doc) {
    var db = this.db;
    this.queue.push(function(cb) {
      db.remove(doc, cb);
    });
  }

  function propagateDelete(doc) {
    this.actions.remove(doc);
  }

  function propagateInsert(doc) {
    this.actions.insert(doc);
  }

  function propagateUpdate(doc) {
    this.actions.update(doc);
  }

  return function({ getState }) {
    paths.forEach(listen);

    return function(next) {
      return function(action) {
        const returnValue = next(action);
        const newState = getState();

        paths.forEach(path => processNewStateForPath(path, newState));

        return returnValue;
      }
    }
  }
}

function differences(oldDocs, newDocs) {
  const result = {
    new: [],
    updated: [],
    deleted: Object.keys(oldDocs).map(oldDocId => oldDocs[oldDocId]),
  };

  newDocs.forEach(function(newDoc) {
    let id = newDoc._id;
    if (! id) {
      warn('doc with no id');
    }
    result.deleted = result.deleted.filter(doc => doc._id !== id);
    let oldDoc = oldDocs[id];
    if (! oldDoc) {
      result.new.push(newDoc);
    } else if (!equal(oldDoc, newDoc)) {
      result.updated.push(newDoc);
    }
  });

  return result;
}

function onDbChange(path, change) {
  const changeDoc = change.doc;
  if (changeDoc._deleted) {
    if (path.docs[changeDoc._id]) {
      delete path.docs[changeDoc._id];
      path.propagateDelete(changeDoc);
    }
  } else {
    let oldDoc = path.docs[changeDoc._id];
    path.docs[changeDoc._id] = changeDoc;
    if (oldDoc) {
      path.propagateUpdate(changeDoc);
    } else {
      path.propagateInsert(changeDoc);
    }
  }
}

function warn(what) {
  var fn = console.warn || console.log;
  if (fn) {
    fn.call(console, what);
  }
}

function defaultAction(action) {
  return function() {
    throw new Error('no action provided for ' + action);
  };
}