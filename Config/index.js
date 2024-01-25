// Import the functions you need from the SDKs you need
import app from 'firebase/compat/app';
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/storage";
import 'firebase/auth'; // Make sure to include 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB0inDWJjAwoAiT9MP4gYMCUeidER6HmfU",
  authDomain: "fir-whats-e576a.firebaseapp.com",
  projectId: "fir-whats-e576a",
  storageBucket: "fir-whats-e576a.appspot.com",
  messagingSenderId: "532830759003",
  appId: "1:532830759003:web:5b2b13363f79d174bef77e",
  measurementId: "G-7LDXT2HD6N"
}; 

// Initialize Firebase

const firebaseApp = app.initializeApp(firebaseConfig);
export default firebaseApp;
