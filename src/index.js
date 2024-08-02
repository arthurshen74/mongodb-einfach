var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { MongoClient, MongoServerError, ServerApiVersion, ObjectId, WriteConcern, } from 'mongodb';
class EinfachMongoDbCollection {
    // init the client and store it in the clients map.
    static getClient(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._clients.has(url)) {
                this._clients.set(url, new MongoClient(url, options));
            }
            try {
                const client = this._clients.get(url);
                if (client instanceof MongoClient) {
                    return yield client.connect();
                }
                throw new Error('Client is not an instance of MongoClient.');
            }
            catch (error) {
                if (error.codeName === 'AuthenticationFailed') {
                    throw new Error('Authentication Error: Invalid credentials.');
                }
                throw error;
            }
        });
    }
    // expose the map of clients, this allows for more customized usage such as aggregations.
    static clients() {
        return this._clients;
    }
    constructor(serverUrl, dbName, collectionName, clientOptions = {
        monitorCommands: true,
        authSource: 'admin',
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        retryWrites: true,
        writeConcern: new WriteConcern('majority'),
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    }) {
        this._url = '';
        this._options = {};
        this._dbName = '';
        this._collectionName = '';
        this._url = serverUrl;
        this._options = clientOptions;
        this._dbName = dbName;
        this._collectionName = collectionName;
    }
    // count the number of documents in the collection.
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
                const collection = client
                    .db(this._dbName)
                    .collection(this._collectionName);
                const count = yield collection.countDocuments({});
                return count;
            }
            catch (error) {
                if (error instanceof MongoServerError) {
                    return -1; // collection does not exist
                }
                throw error;
            }
        });
    }
    // get all documents in the collection.
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            const cursor = collection.find({});
            const documents = yield cursor.toArray();
            return documents;
        });
    }
    // get a document by its id.
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            let _id = null;
            try {
                _id = new ObjectId(id);
            }
            catch (error) {
                return null;
            }
            const query = { _id };
            const document = (yield collection.findOne(query)) || null;
            return document;
        });
    }
    // insert a new document into the collection.
    insert(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            const result = yield collection.insertOne(data);
            const insertedId = result.insertedId;
            const insertedDocument = Object.assign(Object.assign({}, data), { _id: insertedId });
            return insertedDocument;
        });
    }
    // update a document in the collection
    update(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            const { _id } = data, document = __rest(data, ["_id"]);
            let formattedId = null;
            try {
                formattedId = _id instanceof ObjectId ? _id : new ObjectId(_id);
            }
            catch (error) {
                throw new Error('Invalid _id.');
            }
            const query = { _id: formattedId };
            const update = { $set: document };
            const result = (yield collection.updateOne(query, update));
            const { matchedCount, modifiedCount } = result;
            if (matchedCount === 0) {
                throw new Error('Document was not found.');
            }
            if (modifiedCount === 0) {
                throw new Error('Document was not updated.');
            }
            return data;
        });
    }
    // remove a document from the collection.
    remove(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            let _id = null;
            try {
                _id = new ObjectId(id);
            }
            catch (error) {
                return false;
            }
            const query = { _id };
            const result = (yield collection.deleteOne(query));
            const { deletedCount } = result;
            return deletedCount >= 1;
        });
    }
    // drop the collection.
    drop() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield EinfachMongoDbCollection.getClient(this._url, this._options);
            const collection = client
                .db(this._dbName)
                .collection(this._collectionName);
            const result = yield collection.drop();
            return result;
        });
    }
}
// store mongoclients according to their URL key for connection pooling.
EinfachMongoDbCollection._clients = new Map();
export { EinfachMongoDbCollection };
