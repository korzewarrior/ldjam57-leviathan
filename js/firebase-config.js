// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCN200osd_Yu51B6AnkzqgP90Hl-0LmQuQ",
    authDomain: "ldjam57-leviathan.firebaseapp.com",
    projectId: "ldjam57-leviathan",
    storageBucket: "ldjam57-leviathan.firebasestorage.app",
    messagingSenderId: "1087010759682",
    appId: "1:1087010759682:web:ab0be8b84b870481a1b31b",
    measurementId: "G-M9JFTX397L"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  export { db };