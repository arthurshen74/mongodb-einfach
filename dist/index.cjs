"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  EinfachMongoDbCollection: () => EinfachMongoDbCollection
});
module.exports = __toCommonJS(src_exports);
var import_mongodb = require("mongodb");
var _EinfachMongoDbCollection = class _EinfachMongoDbCollection {
  constructor(serverUrl, dbName, collectionName, clientOptions = {
    monitorCommands: true,
    authSource: "admin",
    connectTimeoutMS: 5e3,
    serverSelectionTimeoutMS: 5e3,
    retryWrites: true,
    writeConcern: new import_mongodb.WriteConcern("majority"),
    serverApi: {
      version: import_mongodb.ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  }) {
    this._url = "";
    this._options = {};
    this._dbName = "";
    this._collectionName = "";
    this._url = serverUrl;
    this._options = clientOptions;
    this._dbName = dbName;
    this._collectionName = collectionName;
  }
  // init the client and store it in the clients map.
  static getClient(url, options) {
    return __async(this, null, function* () {
      if (!this._clients.has(url)) {
        this._clients.set(url, new import_mongodb.MongoClient(url, options));
      }
      try {
        const client = this._clients.get(url);
        if (client instanceof import_mongodb.MongoClient) {
          return yield client.connect();
        }
        throw new Error("Client is not an instance of MongoClient.");
      } catch (error) {
        if (error.codeName === "AuthenticationFailed") {
          throw new Error("Authentication Error: Invalid credentials.");
        }
        throw error;
      }
    });
  }
  // expose the map of clients, this allows for more customized usage such as aggregations.
  static clients() {
    return this._clients;
  }
  // count the number of documents in the collection.
  count() {
    return __async(this, null, function* () {
      try {
        const client = yield _EinfachMongoDbCollection.getClient(
          this._url,
          this._options
        );
        const collection = client.db(this._dbName).collection(this._collectionName);
        const count = yield collection.countDocuments({});
        return count;
      } catch (error) {
        if (error instanceof import_mongodb.MongoServerError) {
          return -1;
        }
        throw error;
      }
    });
  }
  // get all documents in the collection.
  get() {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      const cursor = collection.find({});
      const documents = yield cursor.toArray();
      return documents;
    });
  }
  // get a document by its id.
  getById(id) {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      let _id = null;
      try {
        _id = new import_mongodb.ObjectId(id);
      } catch (error) {
        return null;
      }
      const query = { _id };
      const document = (yield collection.findOne(query)) || null;
      return document;
    });
  }
  // insert a new document into the collection.
  insert(data) {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      const result = yield collection.insertOne(
        data
      );
      const insertedId = result.insertedId;
      const insertedDocument = __spreadProps(__spreadValues({}, data), { _id: insertedId });
      return insertedDocument;
    });
  }
  // update a document in the collection
  update(data) {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      const _a = data, { _id } = _a, document = __objRest(_a, ["_id"]);
      let formattedId = null;
      try {
        formattedId = _id instanceof import_mongodb.ObjectId ? _id : new import_mongodb.ObjectId(_id);
      } catch (error) {
        throw new Error("Invalid _id.");
      }
      const query = { _id: formattedId };
      const update = { $set: document };
      const result = yield collection.updateOne(
        query,
        update
      );
      const { matchedCount, modifiedCount } = result;
      if (matchedCount === 0) {
        throw new Error("Document was not found.");
      }
      if (modifiedCount === 0) {
        throw new Error("Document was not updated.");
      }
      return data;
    });
  }
  // remove a document from the collection.
  remove(id) {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      let _id = null;
      try {
        _id = new import_mongodb.ObjectId(id);
      } catch (error) {
        return false;
      }
      const query = { _id };
      const result = yield collection.deleteOne(
        query
      );
      const { deletedCount } = result;
      return deletedCount >= 1;
    });
  }
  // drop the collection.
  drop() {
    return __async(this, null, function* () {
      const client = yield _EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );
      const collection = client.db(this._dbName).collection(this._collectionName);
      const result = yield collection.drop();
      return result;
    });
  }
};
// store mongoclients according to their URL key for connection pooling.
_EinfachMongoDbCollection._clients = /* @__PURE__ */ new Map();
var EinfachMongoDbCollection = _EinfachMongoDbCollection;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EinfachMongoDbCollection
});
//# sourceMappingURL=index.cjs.map