import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "progress_tracker";

function createClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  return new MongoClient(uri, {
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClient().connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = createClient().connect();
}

export async function getDatabase() {
  const client = await clientPromise;
  return client.db(dbName);
}
