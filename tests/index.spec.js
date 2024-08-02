var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b;
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env into process.env
import { expect } from 'chai';
import { MongoClient, WriteConcern, ServerApiVersion, ObjectId, } from 'mongodb';
import { EinfachMongoDbCollection, } from '../dist/index.js'; // Adjust the path as necessary
// Number of test documents
const documentCount = 1000;
// MongoDB connection options
const localDockerServerUrl = (_a = process.env.MONGO_CONNECT_URL) !== null && _a !== void 0 ? _a : '';
const localDockerServerDbName = (_b = process.env.MONGO_DB_NAME) !== null && _b !== void 0 ? _b : '';
const localDockerServerOptions = {
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
};
// Function to generate a random ObjectId
const generateRandomObjectId = () => {
    const random = Math.floor(Math.random() * 16777216);
    return new ObjectId(random);
};
// Helper function to create test documents
const createTestDocuments = (count) => {
    const documents = [];
    for (let i = 0; i < count; i++) {
        documents.push({
            id: i.toString(),
            name: `Document ${i}`,
            desc: `Description for Document ${i}`,
        });
    }
    return documents;
};
describe('EinfachMongoDbCollection: Single Instance', () => {
    let collection = null;
    let documents = [];
    let client = null;
    // Before all tests, establish connection and initialize test data
    before(() => __awaiter(void 0, void 0, void 0, function* () {
        collection = new EinfachMongoDbCollection(localDockerServerUrl, localDockerServerDbName, 'testDocuments');
        documents = createTestDocuments(documentCount);
        client = new MongoClient(localDockerServerUrl, localDockerServerOptions);
        yield client.connect();
        console.log('\x1b[32m    + \x1b[90mConnected to MongoDB.\x1b[0m');
    }));
    // test the static clients map.
    it('should return a client at the specified URL', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (collection) {
            const initCount = yield collection.count();
            expect(initCount).to.equal(0);
            const client = (_a = EinfachMongoDbCollection.clients().get(localDockerServerUrl)) !== null && _a !== void 0 ? _a : null;
            expect(client, 'The client should not be null.').to.not.be.null;
            expect(client).to.be.instanceOf(MongoClient);
        }
    }));
    // Test that the instance of EinfachMongoDbCollection is created
    it('should be an instance of EinfachMongoDbCollection', () => {
        expect(collection).to.be.instanceOf(EinfachMongoDbCollection);
    });
    // Insert documents
    it(`.insert() should return ${documentCount} document(s)`, () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            expect(results).to.have.lengthOf(documentCount);
            for (const item of results) {
                expect(item).to.have.property('_id');
            }
            const count = yield (client === null || client === void 0 ? void 0 : client.db(localDockerServerDbName).collection('testDocuments').countDocuments());
            expect(count).to.equal(documentCount);
        }
    }));
    // Count method test
    it(`.count() should return ${documentCount}.`, () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            const initCount = yield collection.count();
            expect(initCount).to.equal(0);
            for (const doc of documents) {
                yield collection.insert(doc);
            }
            const count = yield collection.count();
            expect(count).to.equal(documentCount);
        }
    }));
    // getById method test
    it(`.getById() should retrieve up to ${Math.min(documentCount, 100)} document(s)`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            expect(results).to.have.lengthOf(documentCount);
            const ids = results
                .slice(0, 100)
                .map(doc => doc._id);
            for (const _id of ids) {
                const id = (_a = _id === null || _id === void 0 ? void 0 : _id.toString()) !== null && _a !== void 0 ? _a : '';
                const doc = yield collection.getById(id);
                expect((_b = doc === null || doc === void 0 ? void 0 : doc._id) === null || _b === void 0 ? void 0 : _b.toString()).to.equal(id);
            }
        }
    }));
    // get method test
    it(`.get() should return ${documentCount} documents`, () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            for (const doc of documents) {
                yield collection.insert(doc);
            }
            const results = yield collection.get();
            expect(results).to.have.lengthOf(documentCount);
            for (const item of results) {
                expect(item).to.have.property('_id');
            }
        }
    }));
    // remove method test
    it(`.remove() should remove up to ${Math.min(documentCount, 100)} document(s)`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            expect(results).to.have.lengthOf(documentCount);
            const ids = results
                .slice(0, 100)
                .map(doc => doc._id);
            for (const _id of ids) {
                const id = (_a = _id === null || _id === void 0 ? void 0 : _id.toString()) !== null && _a !== void 0 ? _a : '';
                yield collection.remove(id);
            }
            const count = yield collection.count();
            expect(count).to.equal(documentCount - 100);
        }
    }));
    // update method test
    it(`.update() should update up to ${Math.min(documentCount, 100)} document(s) with merge.`, () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            expect(results).to.have.lengthOf(documentCount);
            const ids = results.slice(0, 100);
            let idx = documentCount;
            for (const item of ids) {
                const id = (_b = (_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : idx.toString();
                const doc = {
                    _id: item._id,
                    id: id,
                    name: `Document ${id}`,
                    desc: `Description for Document ${id}`,
                    test: id,
                };
                yield collection.update(doc);
                idx += 1;
            }
            idx = documentCount;
            for (const item of ids) {
                const doc = yield (client === null || client === void 0 ? void 0 : client.db(localDockerServerDbName).collection('testDocuments').findOne({ _id: item._id }));
                expect(doc === null || doc === void 0 ? void 0 : doc.test).to.equal((_d = (_c = item._id) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : idx.toString());
                idx += 1;
            }
        }
    }));
    // Test case: bad authentication should throw error
    it('should throw AuthenticationError for bad authentication', () => __awaiter(void 0, void 0, void 0, function* () {
        const badCollection = new EinfachMongoDbCollection('mongodb://root:badpassword@localhost:27017/nothing', 'nothing', 'testDocuments');
        try {
            const count = yield badCollection.count();
            expect.fail('Expected the function call to throw an error but it did not.');
        }
        catch (error) {
            if (error instanceof Error) {
                expect(error).to.be.instanceOf(Error);
                expect(error.message).to.match(/Authentication Error/gi);
                return;
            }
            expect.fail('Expected the function call to throw an error but it did not.');
        }
    }));
    // Test case: getById() with non-existent id should return null
    it('should return null for getById() with non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            for (const doc of documents) {
                yield collection.insert(doc);
            }
            const randomId = generateRandomObjectId();
            const result = yield collection.getById(randomId.toString());
            expect(result).to.be.null;
        }
    }));
    // Test case: update() with invalid id format should throw error
    it('should throw error for update() with Document was not found', () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            const firstDoc = results[0];
            const randomId = generateRandomObjectId();
            firstDoc._id = randomId;
            firstDoc.test = randomId.toString();
            try {
                const updateDoc = yield collection.update(firstDoc);
                expect.fail('Expected the function call to throw an error but it did not.');
            }
            catch (error) {
                if (error instanceof Error) {
                    expect(error).to.be.instanceOf(Error);
                    expect(error.message).to.match(/Document was not found\./gi);
                    return;
                }
                expect.fail('Expected the function call to throw an error but it did not.');
            }
        }
    }));
    // Test case: update() with invalid id format should throw error
    it('should throw error for update() with Document was not updated.', () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            const results = [];
            for (const doc of documents) {
                results.push(yield collection.insert(doc));
            }
            const firstDoc = results[0];
            try {
                const updateDoc = yield collection.update(firstDoc);
                expect.fail('Expected the function call to throw an error but it did not.');
            }
            catch (error) {
                if (error instanceof Error) {
                    expect(error).to.be.instanceOf(Error);
                    expect(error.message).to.match(/Document was not updated\./gi);
                    return;
                }
                expect.fail('Expected the function call to throw an error but it did not.');
            }
        }
    }));
    // Test case: remove() with non-existent id should return false
    it('should return false for remove() with non-existent id', () => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            for (const doc of documents) {
                yield collection.insert(doc);
            }
            const randomId = generateRandomObjectId();
            const result = yield collection.remove(randomId.toString());
            expect(result).to.be.false;
        }
    }));
    // After each test, drop the collection
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        if (collection) {
            yield collection.drop();
        }
    }));
    // After all tests, clean up resources
    after(() => __awaiter(void 0, void 0, void 0, function* () {
        collection = null;
        yield (client === null || client === void 0 ? void 0 : client.close());
        console.log('\x1b[32m    + \x1b[90mDisconnected from MongoDB.\x1b[0m');
    }));
});
// TODO: test multiple collection instances
// TODO: test multiple connection strings (need to instantiate two MongoDB servers)
