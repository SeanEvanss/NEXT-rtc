import firebase from "firebase/app";
import "firebase/firestore"
import Script from "next/script";
import { useEffect, useRef } from "react";


/** @type {firebase} */


export default function Webcam() {
    useEffect(() => {
        initiateconnection();
    }, []);

    const localstreamRef = useRef();
    const remotestreamRef = useRef();
    var pc;

    var firestore;
    var passcode = "00000";




    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyDIMmo5qQeb3TqfR1OkqxWD1BDNgZxz0-Q",
        authDomain: "fir-rtc-c2f90.firebaseapp.com",
        projectId: "fir-rtc-c2f90",
        storageBucket: "fir-rtc-c2f90.appspot.com",
        messagingSenderId: "1017752011996",
        appId: "1:1017752011996:web:f7d7816dd1f98d8f4b2019",
        measurementId: "G-8FVDJGLLMB"
      };
    // Initialize Firebase
    async function initiateconnection() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        } else {
            firebase.app(); // if already initialized, use that one
        }
        firestore = firebase.firestore();
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
        remoteStream = new MediaStream();

        localstream.getTracks().forEach(track => {
            console.log(`Adding local stream track: ${track.kind}`);
            pc.addTrack(track, localstream);
        });
        console.log("Local stream added");
        localstreamRef.current.srcObject = localstream;


        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
            console.log("Remote stream added");
            remotevideo.srcObject = remoteStream;
        }
    }

    async function startCall() {
        console.log("Starting call");
        const callDoc = firestore.collection("calls").doc();
        const offerCandidate = callDoc.collection("offerCandidates");
        const answerCandidates = callDoc.collection("answerCandidates");

        passcode = callDoc.id;


        //Add a suitable ice candidate to the collections db in firestore
        pc.onicecandidate = (event) => {
            console.log(event.candidate);
            event.candidate && offerCandidate.add(event.candidate.toJSON());
        }

        //Create the offer itself
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        console.log("Offer created");

        //Listen for an answer on the db
        callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();

        });
        // When answered, add candidate to peer connection
        answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });


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
                2. Enable webcam and audio
            </h1>
            <div id="streamconnection" className="flex flex-row justify-center p-10" >
                <button onClick={getLocalStream} className="bg-blue-500 text-white rounded-full p-3">
                    Start webcam and mic
                </button>
            </div>
            <h1>
                2. Start / answer call
            </h1>
            <div id="streamconnection" className="flex flex-row justify-center p-10" >
                <button onClick={startCall} className="bg-blue-500 text-white rounded-full p-3">
                    Start call
                </button>
                <button className="bg-green-500 text-white rounded-full p-3">
                    Answer Call
                </button>
            </div>
        </div>
    );
}




