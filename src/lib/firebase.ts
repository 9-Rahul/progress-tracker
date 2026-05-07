import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBog_hsuS5Nj3-DMbpl26WxPfdL_JxVSVA",
  authDomain: "progress-tracker-2.firebaseapp.com",
  projectId: "progress-tracker-2",
  storageBucket: "progress-tracker-2.firebasestorage.app",
  messagingSenderId: "609257316249",
  appId: "1:609257316249:web:f0ec41aa35cf526843bd08"
};

export const isFirebaseConfigured = true;

export const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const googleProvider = firebaseAuth ? new GoogleAuthProvider() : null;
