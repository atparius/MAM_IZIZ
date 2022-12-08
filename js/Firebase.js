 // Import the functions you need from the SDKs you need
 import {
     initializeApp
 } from "firebase/app";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries
 import {
     getAuth,
     signInAnonymously
 } from "firebase/auth";
 import {
     getDatabase,
     ref,
     set,
     onValue
 } from "firebase/database";

 export default class Firebase {
     constructor() {


         // Your web app's Firebase configuration
         const firebaseConfig = {
             apiKey: "AIzaSyDz_6Pjs3ZilijinyKFn7piziELYE6oc1M",
             authDomain: "royalewithcheese-aa332.firebaseapp.com",
             databaseURL: "https://royalewithcheese-aa332-default-rtdb.europe-west1.firebasedatabase.app",
             projectId: "royalewithcheese-aa332",
             storageBucket: "royalewithcheese-aa332.appspot.com",
             messagingSenderId: "1033521093333",
             appId: "1:1033521093333:web:c6aa7b7ca96cc327b1e05c"
         };

         // Initialize Firebase
         const app = initializeApp(firebaseConfig);

         const auth = getAuth();

         signInAnonymously(auth)
             .then(() => {
                 console.log("signed in");
             })
             .catch((erro) => {
                 const errorCode = error.code;
                 const errorMessage = error.message;
                 console.log(errorCode, errorMessage);
             });
         this.DATABASE = getDatabase();
     }
     addEventListener(_path, _callback) {
         console.log("Firebase listener added");
         const path = ref(this.DATABASE, _path);

         onValue(path, (snapshot) => {
             const data = snapshot.val();
             _callback(data);
         });
     }

     send(_path, _val) {
         const path = ref(this.DATABASE, _path);
         set(path, _val);
     }
 }