import firebase from "firebase/app";
import "firebase/firestore"
import Script from "next/script";
import { useEffect } from "react";

export default function Webcam() {
    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: process.env.firebase_apiKey,
        authDomain: process.env.firebase_authDomain,
        projectId: process.env.firebase_projectId,
        storageBucket: process.env.firebase_storageBucket,
        messagingSenderId: process.env.firebase_messagingSenderId,
        appId: process.env.firebase_appId,
        measurementId: process.env.firebase_measurementId
    };

    // Initialize Firebase
    async function initiateconnection(){
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
         }else {
            firebase.app(); // if already initialized, use that one
         }
        const firestore= firebase.firestore();
        console.log("Connection intialised");
    }

    useEffect(() => {
        initiateconnection();
    } , []);
                

    return (
        <div className='flex flex-col items-center'>
            <h1 className='text-5xl'>
                Work in progress check back soon.
            </h1>
            <div id="videos" className="flex flex-row" >
                <video id="hostVideoFeed" autoPlay playsInline />
                <video id="guestVideoFeed" autoPlay playsInline />
            </div>
            <h1 className="flex flex-col">1. Initiate a connection
                <button onClick={initiateconnection} className="bg-blue-500 text-white rounded-full">
                    Start connection
                </button>
            </h1>
        </div>
    );
}

export async function getStaticProps() {
    initiateconnection();
}


