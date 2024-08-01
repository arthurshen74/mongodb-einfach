import {
  MongoClient,
  MongoClientOptions,
  MongoServerError,
  ServerApiVersion,
  FindCursor,
  Filter,
  ObjectId,
  WriteConcern,
  UpdateResult,
  DeleteResult,
  OptionalId,
  OptionalUnlessRequiredId,
  Document,
} from 'mongodb';

/**
 * MongoDB Einfach
 *
 * Expose a mongoDb collection as a class.
 *
 * @version 1.0.0
 */

interface EinfachMongoDbDocument extends OptionalId<Document> {
  _id?: ObjectId;
  revision?: number;
  revisionDate?: Date;
}

class EinfachMongoDbCollection<T extends EinfachMongoDbDocument> {
  // store mongoclients according to their URL key for connection pooling.
  private static _clients: Map<string, MongoClient> = new Map();

  // init the client and store it in the clients map.
  private static async getClient(
    url: string,
    options: MongoClientOptions
  ): Promise<MongoClient> {
    if (!this._clients.has(url)) {
      this._clients.set(url, new MongoClient(url, options));
    }

    try {
      const client = this._clients.get(url);
      if (client instanceof MongoClient) {
        return await client.connect();
      }
      throw new Error('Client is not an instance of MongoClient.');
    } catch (error: any) {
      if (error.codeName === 'AuthenticationFailed') {
        throw new Error('Authentication Error: Invalid credentials.');
      }
      throw error;
    }
  }

  // expose the map of clients, this allows for more customized usage such as aggregations.
  static clients(): Map<string, MongoClient> {
    return this._clients;
  }

  private _url: string = '';
  private _options: MongoClientOptions = {};
  private _dbName: string = '';
  private _collectionName: string = '';

  constructor(
    serverUrl: string,
    dbName: string,
    collectionName: string,
    clientOptions: MongoClientOptions = {
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
    }
  ) {
    this._url = serverUrl;
    this._options = clientOptions;
    this._dbName = dbName;
    this._collectionName = collectionName;
  }

  // count the number of documents in the collection.
  async count(): Promise<number> {
    try {
      const client = await EinfachMongoDbCollection.getClient(
        this._url,
        this._options
      );

      const collection = client
        .db(this._dbName)
        .collection<T>(this._collectionName);
      const count: number = await collection.countDocuments({});
      return count;
    } catch (error) {
      if (error instanceof MongoServerError) {
        return -1; // collection does not exist
      }
      throw error;
    }
  }

  // get all documents in the collection.
  async get(): Promise<T[]> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    const cursor = collection.find({}) as unknown as FindCursor<T>;
    const documents: T[] = await cursor.toArray();
    return documents;
  }

  // get a document by its id.
  async getById(id: string): Promise<T | null> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    let _id: ObjectId | null = null;
    try {
      _id = new ObjectId(id);
    } catch (error) {
      return null;
    }
    const query = { _id } as Filter<T>;
    const document = ((await collection.findOne(query)) as T) || null;
    return document;
  }

  // insert a new document into the collection.
  async insert(data: T): Promise<T> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    const result = await collection.insertOne(
      data as OptionalUnlessRequiredId<T>
    );
    const insertedId: ObjectId | null =
      result.insertedId as ObjectId | null;
    const insertedDocument = { ...data, _id: insertedId } as T;
    return insertedDocument;
  }

  // update a document in the collection
  async update(data: T): Promise<T> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    const { _id, ...document } = data;
    let formattedId = null;
    try {
      formattedId = _id instanceof ObjectId ? _id : new ObjectId(_id);
    } catch (error) {
      throw new Error('Invalid _id.');
    }
    const query = { _id: formattedId } as Filter<T>;
    const update = { $set: document } as Document;
    const result: UpdateResult = (await collection.updateOne(
      query,
      update
    )) as UpdateResult;
    const { matchedCount, modifiedCount } = result;
    if (matchedCount === 0) {
      throw new Error('Document was not found.');
    }
    if (modifiedCount === 0) {
      throw new Error('Document was not updated.');
    }
    return data;
  }

  // remove a document from the collection.
  async remove(id: string): Promise<boolean> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    let _id: ObjectId | null = null;
    try {
      _id = new ObjectId(id);
    } catch (error) {
      return false;
    }

    const query = { _id } as Filter<T>;
    const result: DeleteResult = (await collection.deleteOne(
      query
    )) as DeleteResult;
    const { deletedCount } = result;
    return deletedCount >= 1;
  }

  // drop the collection.
  async drop(): Promise<boolean> {
    const client = await EinfachMongoDbCollection.getClient(
      this._url,
      this._options
    );
    const collection = client
      .db(this._dbName)
      .collection<T>(this._collectionName);
    const result = await collection.drop();
    return result;
  }
}

export { EinfachMongoDbCollection, EinfachMongoDbDocument };
