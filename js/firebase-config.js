// Firebase configuration - TEMPORARILY DISABLED FOR SECURITY
// This file is now set up to work with environment variables instead of hardcoded values
// NOTE: API keys have been removed and should be moved to .env file

// Mock implementation for offline mode
const mockDB = {
  collection: (collectionName) => ({
    orderBy: () => ({
      limit: () => ({
        get: async () => ({
          forEach: () => {},
          empty: true
        })
      })
    }),
    add: async (data) => {
      console.log('In offline mode - data would be saved:', data);
      return { id: 'mock-id-' + Date.now() };
    }
  })
};

// Simulated database for offline mode
const db = mockDB;

export { db };

/* 
// This would be the secure implementation with environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export { db };
*/