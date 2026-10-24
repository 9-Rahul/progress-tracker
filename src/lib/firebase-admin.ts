import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let serviceAccount: any = null;

// Try to load from file first (most stable for local dev)
const saPath = path.join(process.cwd(), "service-account.json");
if (fs.existsSync(saPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(saPath, "utf8"));
  } catch (e) {
    console.error("Failed to parse service-account.json", e);
  }
}

// Fallback to environment variable
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } catch (e) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT env var", e);
  }
}

if (!admin.apps.length) {
  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } else {
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
