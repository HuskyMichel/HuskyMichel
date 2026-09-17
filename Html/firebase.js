import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


const firebaseConfig = {

    apiKey: "AIzaSyA_4v5IjbJBT3R6dyKAtGmsqy-EA_3a73U",

    authDomain: "huskymichel2.firebaseapp.com",

    projectId: "huskymichel2",

    storageBucket: "huskymichel2.firebasestorage.app",

    messagingSenderId: "803041103978",

    appId: "1:803041103978:web:0415d72f91e30735a47a13"

};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);


const db = getFirestore(app);


const storage = getStorage(app);


export { auth, db, storage };