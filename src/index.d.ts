import {
  MongoClientOptions,
  ServerApiVersion,
  MongoClient,
  ObjectId,
  WriteConcern,
  OptionalId,
  Document,
} from 'mongodb';

interface EinfachMongoDbDocument extends OptionalId<Document> {
  _id?: ObjectId;
  revision?: number;
  revisionDate?: Date;
}

declare class EinfachMongoDbCollection<T extends EinfachMongoDbDocument> {
  private static _clients: Map<string, MongoClient>;

  static clients(): Map<string, MongoClient>;

  constructor(
    serverUrl: string,
    dbName: string,
    collectionName: string,
    clientOptions?: MongoClientOptions & {
      monitorCommands?: boolean;
      authSource?: string;
      connectTimeoutMS?: number;
      serverSelectionTimeoutMS?: number;
      retryWrites?: boolean;
      writeConcern?: WriteConcern;
      serverApi?: {
        version: ServerApiVersion;
        strict?: boolean;
        deprecationErrors?: boolean;
      };
    }
  );

  count(): Promise<number>;

  get(): Promise<T[]>;

  getById(id: string): Promise<T | null>;

  insert(data: T): Promise<T>;

  update(data: T): Promise<T>;

  remove(id: string): Promise<boolean>;

  drop(): Promise<boolean>;
}

export { EinfachMongoDbCollection, EinfachMongoDbDocument };
