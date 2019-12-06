import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/auth'

const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_DATABASE_URL,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const database = firebase.database()

const auth = firebase.auth()
const googleProvider = new firebase.auth.GoogleAuthProvider()
const facebookProvider = new firebase.auth.FacebookAuthProvider()

const signInWithGoogle = () =>
  auth.signInWithPopup(googleProvider)

const signInWithFacebook = () => 
  auth.signInWithPopup(facebookProvider)

export {database , signInWithGoogle, signInWithFacebook}