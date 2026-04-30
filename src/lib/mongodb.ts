import { MongoClient, ServerApiVersion } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var paceMongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "progress_tracker";

function createClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  return new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true
    }
  });
}

export async function getDatabase() {
  if (!global.paceMongoClientPromise) {
    global.paceMongoClientPromise = createClient().connect();
  }

  const client = await global.paceMongoClientPromise;
  return client.db(dbName);
}
