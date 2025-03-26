// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBy2aruewGmoLCqLdjunl2qCcAmLYYPM5A",
  authDomain: "nvs-system.firebaseapp.com",
  projectId: "nvs-system",
  storageBucket: "nvs-system.firebasestorage.app",
  messagingSenderId: "118651694305",
  appId: "1:118651694305:web:b52a1cecb3e2b42af5dba0",
  measurementId: "G-116ZZ51XPY",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export { storage };
