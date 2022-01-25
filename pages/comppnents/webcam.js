import firebase from "firebase/app";
import "firebase/firestore"
import Script from "next/script";
import { useEffect, useRef } from "react";

export default function Webcam() {
    useEffect(() => {
        initiateconnection();
    }, []);

    const localstreamRef = useRef();
    const remotestreamRef = useRef();
    var pc= null;

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
    async function initiateconnection() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
            firebase.app(); // if already initialized, use that one
        }
        const firestore = firebase.firestore();
        console.log("Connection intialised");
        pc = new RTCPeerConnection(servers);
    }

    const servers = {
        iceServers: [
            {
                urls: ["stun:stun.l.google.com:19302", 'stun:stun2.l.google.com:19302']
            }
        ],
        iceCandidatePoolSize: 20
    }

    //Meida streams for both local and remote video and audio
    let localstream = null;
    let remoteStream = null;


    //This is the function that is called when the user clicks the button to start the call
    async function getLocalStream() {
        localstream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        remoteStream= new MediaStream();

        localstream.getTracks().forEach(track => {
            pc.addTrack(track, localstream);
        });
        console.log("Local stream added");
        localstreamRef.current.srcObject = localstream;


        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
                console.log("Remote stream added");
            });                
            remotevideo.srcObject = remoteStream;
        }
    }

    
    





    return (
        <div className='flex flex-col items-center'>
            <h1 className='text-5xl p-10'>
                Work in progress check back soon.
            </h1>
            <div id="videos" className="flex flex-row" >
                <video ref={localstreamRef} id="hostVideoFeed" autoPlay playsInline />
                <video ref={remotestreamRef} id="guestVideoFeed" autoPlay playsInline />
            </div>
            <div className="flex flex-col p-10">1. Initiate a connection
                <button onClick={initiateconnection} className="bg-blue-500 text-white rounded-full">
                    Start connection
                </button>
            </div>
            <h1>
                2. Start call
            </h1>
            <div id="streamconnection" className="flex flex-row justify-center p-10" >                
                <button onClick={getLocalStream} className="bg-blue-500 text-white rounded-full p-3">
                    Initiate call
                </button>
            </div>
        </div>
    );
}

export async function getStaticProps() {
    initiateconnection();
}


