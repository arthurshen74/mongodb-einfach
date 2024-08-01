import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env into process.env

import { expect } from 'chai';
import {
  MongoClient,
  WriteConcern,
  ServerApiVersion,
  ObjectId,
} from 'mongodb';

import {
  EinfachMongoDbDocument,
  EinfachMongoDbCollection,
} from './index.js'; // Adjust the path as necessary

// Number of test documents
const documentCount: number = 1000;

// MongoDB connection options
const localDockerServerUrl: string = process.env.MONGO_CONNECT_URL ?? '';
const localDockerServerDbName: string = process.env.MONGO_DB_NAME ?? '';
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
const generateRandomObjectId = (): ObjectId => {
  const random: number = Math.floor(Math.random() * 16777216);

  return new ObjectId(random);
};

// Helper function to create test documents
const createTestDocuments = (count: number): TestDocument[] => {
  const documents: TestDocument[] = [];
  for (let i = 0; i < count; i++) {
    documents.push({
      id: i.toString(),
      name: `Document ${i}`,
      desc: `Description for Document ${i}`,
    });
  }
  return documents;
};

type TestDocument = EinfachMongoDbDocument & {
  id: string;
  name: string;
  desc: string;
};

describe('EinfachMongoDbCollection: Single Instance', () => {
  let collection: EinfachMongoDbCollection<TestDocument> | null = null;
  let documents: TestDocument[] = [];
  let client: MongoClient | null = null;

  // Before all tests, establish connection and initialize test data
  before(async () => {
    collection = new EinfachMongoDbCollection(
      localDockerServerUrl,
      localDockerServerDbName,
      'testDocuments'
    );
    documents = createTestDocuments(documentCount);
    client = new MongoClient(
      localDockerServerUrl,
      localDockerServerOptions
    );
    await client.connect();
    console.log('\x1b[32m    + \x1b[90mConnected to MongoDB.\x1b[0m');
  });

  // test the static clients map.
  it('should return a client at the specified URL', async () => {
    if (collection) {
      const initCount: number = await collection.count();
      expect(initCount).to.equal(0);
      const client: MongoClient | null =
        EinfachMongoDbCollection.clients().get(localDockerServerUrl) ??
        null;
      expect(client, 'The client should not be null.').to.not.be.null;
      expect(client).to.be.instanceOf(MongoClient);
    }
  });

  // Test that the instance of EinfachMongoDbCollection is created
  it('should be an instance of EinfachMongoDbCollection', () => {
    expect(collection).to.be.instanceOf(EinfachMongoDbCollection);
  });

  // Insert documents
  it(`.insert() should return ${documentCount} document(s)`, async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      expect(results).to.have.lengthOf(documentCount);
      for (const item of results) {
        expect(item).to.have.property('_id');
      }
      const count = await client
        ?.db(localDockerServerDbName)
        .collection('testDocuments')
        .countDocuments();
      expect(count).to.equal(documentCount);
    }
  });

  // Count method test
  it(`.count() should return ${documentCount}.`, async () => {
    if (collection) {
      const initCount: number = await collection.count();
      expect(initCount).to.equal(0);
      for (const doc of documents) {
        await collection.insert(doc);
      }
      const count = await collection.count();
      expect(count).to.equal(documentCount);
    }
  });

  // getById method test
  it(`.getById() should retrieve up to ${Math.min(
    documentCount,
    100
  )} document(s)`, async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      expect(results).to.have.lengthOf(documentCount);
      const ids: (ObjectId | undefined)[] = results
        .slice(0, 100)
        .map(doc => doc._id);
      for (const _id of ids) {
        const id: string = _id?.toString() ?? '';
        const doc: TestDocument | null = await collection.getById(id);
        expect(doc?._id?.toString()).to.equal(id);
      }
    }
  });

  // get method test
  it(`.get() should return ${documentCount} documents`, async () => {
    if (collection) {
      for (const doc of documents) {
        await collection.insert(doc);
      }
      const results: TestDocument[] = await collection.get();
      expect(results).to.have.lengthOf(documentCount);
      for (const item of results) {
        expect(item).to.have.property('_id');
      }
    }
  });

  // remove method test
  it(`.remove() should remove up to ${Math.min(
    documentCount,
    100
  )} document(s)`, async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      expect(results).to.have.lengthOf(documentCount);
      const ids: (ObjectId | undefined)[] = results
        .slice(0, 100)
        .map(doc => doc._id);
      for (const _id of ids) {
        const id: string = _id?.toString() ?? '';
        await collection.remove(id);
      }
      const count: number = await collection.count();
      expect(count).to.equal(documentCount - 100);
    }
  });

  // update method test
  it(`.update() should update up to ${Math.min(
    documentCount,
    100
  )} document(s) with merge.`, async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      expect(results).to.have.lengthOf(documentCount);
      const ids: TestDocument[] = results.slice(0, 100);
      let idx = documentCount;
      for (const item of ids) {
        const id = item._id?.toString() ?? idx.toString();
        const doc = {
          _id: item._id,
          id: id,
          name: `Document ${id}`,
          desc: `Description for Document ${id}`,
          test: id,
        };
        await collection.update(doc);
        idx += 1;
      }
      idx = documentCount;
      for (const item of ids) {
        const doc = await client
          ?.db(localDockerServerDbName)
          .collection('testDocuments')
          .findOne({ _id: item._id });
        expect(doc?.test).to.equal(item._id?.toString() ?? idx.toString());
        idx += 1;
      }
    }
  });

  // Test case: bad authentication should throw error
  it('should throw AuthenticationError for bad authentication', async () => {
    const badCollection: EinfachMongoDbCollection<TestDocument> =
      new EinfachMongoDbCollection(
        'mongodb://root:badpassword@localhost:27017/nothing',
        'nothing',
        'testDocuments'
      );
    try {
      const count: number = await badCollection.count();
      expect.fail(
        'Expected the function call to throw an error but it did not.'
      );
    } catch (error) {
      if (error instanceof Error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.match(/Authentication Error/gi);
        return;
      }
      expect.fail(
        'Expected the function call to throw an error but it did not.'
      );
    }
  });

  // Test case: getById() with non-existent id should return null
  it('should return null for getById() with non-existent id', async () => {
    if (collection) {
      for (const doc of documents) {
        await collection.insert(doc);
      }
      const randomId: ObjectId = generateRandomObjectId();
      const result = await collection.getById(randomId.toString());
      expect(result).to.be.null;
    }
  });

  // Test case: update() with invalid id format should throw error
  it('should throw error for update() with Document was not found', async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      const firstDoc: TestDocument = results[0];
      const randomId: ObjectId = generateRandomObjectId();
      firstDoc._id = randomId;
      firstDoc.test = randomId.toString();

      try {
        const updateDoc: TestDocument = await collection.update(firstDoc);
        expect.fail(
          'Expected the function call to throw an error but it did not.'
        );
      } catch (error) {
        if (error instanceof Error) {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.match(/Document was not found\./gi);
          return;
        }
        expect.fail(
          'Expected the function call to throw an error but it did not.'
        );
      }
    }
  });

  // Test case: update() with invalid id format should throw error
  it('should throw error for update() with Document was not updated.', async () => {
    if (collection) {
      const results: TestDocument[] = [];
      for (const doc of documents) {
        results.push(await collection.insert(doc));
      }
      const firstDoc: TestDocument = results[0];

      try {
        const updateDoc: TestDocument = await collection.update(firstDoc);
        expect.fail(
          'Expected the function call to throw an error but it did not.'
        );
      } catch (error) {
        if (error instanceof Error) {
          expect(error).to.be.instanceOf(Error);
          expect(error.message).to.match(/Document was not updated\./gi);
          return;
        }
        expect.fail(
          'Expected the function call to throw an error but it did not.'
        );
      }
    }
  });

  // Test case: remove() with non-existent id should return false
  it('should return false for remove() with non-existent id', async () => {
    if (collection) {
      for (const doc of documents) {
        await collection.insert(doc);
      }
      const randomId: ObjectId = generateRandomObjectId();
      const result = await collection.remove(randomId.toString());
      expect(result).to.be.false;
    }
  });

  // After each test, drop the collection
  afterEach(async () => {
    if (collection) {
      await collection.drop();
    }
  });

  // After all tests, clean up resources
  after(async () => {
    collection = null;
    await client?.close();
    console.log('\x1b[32m    + \x1b[90mDisconnected from MongoDB.\x1b[0m');
  });
});

// TODO: test multiple collection instances

// TODO: test multiple connection strings (need to instantiate two MongoDB servers)
