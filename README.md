# EinfachMongoDbCollection Class

MongoDB Einfach

Expose a MongoDB collection as a TypeScript class.

**Version:** 1.0.0

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [Constructor](#constructor)
  - [Static Methods](#static-methods)
    - [clients()](#clients)
  - [Instance Methods](#instance-methods)
    - [count()](#count)
    - [get()](#get)
    - [getById(id)](#getbyid)
    - [insert(data)](#insert)
    - [update(data)](#update)
    - [remove(id)](#remove)
    - [drop()](#drop)

## Introduction

`EinfachMongoDbCollection` is a simple MongoDB wrapper for NodeJS/NextJS
that I use for my basic CRUD operations. It is opinionated and only handles
a couple of operations that I use all the time. I expose a static Map of
MongoClients with the key being the URL for the server. This way you can
run more custom operations such as aggregations.

## Installation

To use `EinfachMongoDbCollection`, ensure you have MongoDB Node.js driver
installed:

```bash
npm install mongodb
# or
yarn add mongodb
```

## Usage

```typescript
import {
  EinfachMongoDbCollection,
  EinfachMongoDbDocument,
} from './path/to/EinfachMongoDbCollection';

// create your data structure which extends EinfachMongoDbDocument
type MyDocument = EinfachMongoDbDocument & {
  name: string;
  age: number;
};

// Initialize a new instance of EinfachMongoDbCollection
const collection = new EinfachMongoDbCollection<MyDocument>(
  'mongodb://localhost:27017',
  'myDatabase',
  'myCollection'
);

// Example usage:
async function exampleUsage() {
  // Insert a document
  const insertedDoc = await collection.insert({
    name: 'John Doe',
    age: 30,
  });

  // Update a document
  const updatedDoc = await collection.update({
    _id: insertedDoc._id,
    name: 'Jane Doe',
    age: 35,
  });

  // Get a document by ID
  const foundDoc = await collection.getById(insertedDoc._id.toString());

  // Remove a document
  const removed = await collection.remove(insertedDoc._id.toString());
}

exampleUsage();
```

## API

### Constructor

Creates an instance of `EinfachMongoDbCollection`.

```typescript
constructor(
  serverUrl: string,
  dbName: string,
  collectionName: string,
  clientOptions?: MongoClientOptions
)
```

- **serverUrl**: MongoDB server URL.
- **dbName**: Name of the database.
- **collectionName**: Name of the collection.
- **clientOptions**: Optional MongoDB client options.

### Static Methods

#### clients()

Returns a Map of MongoDB clients for connection pooling. A MongoClient is
added to the map **ONLY AFTER** an instance method has been called. **_It
is not enough to just instantiate the instance, you MUST call a method in
order for the MongoClient to be available_**

```typescript
static clients(): Map<string, MongoClient>
```

### Instance Methods

#### count()

Counts the number of documents in the collection.

```typescript
async count(): Promise<number>
```

#### get()

Retrieves all documents from the collection.

```typescript
async get(): Promise<T[]>
```

#### getById(id)

Retrieves a document by its ID.

```typescript
async getById(id: string): Promise<T | null>
```

- **id**: String ID of the document.

#### insert(data)

Inserts a new document into the collection.

```typescript
async insert(data: T): Promise<T>
```

- **data**: Document data to insert.

#### update(data)

Updates a document in the collection.

```typescript
async update(data: T): Promise<T>
```

- **data**: Updated document data.

#### remove(id)

Removes a document from the collection by its ID.

```typescript
async remove(id: string): Promise<boolean>
```

- **id**: String ID of the document to remove.

#### drop()

Drops (deletes) the collection.

```typescript
async drop(): Promise<boolean>
```

---
