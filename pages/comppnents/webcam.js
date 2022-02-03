import firebase from "firebase/app";
import "firebase/firestore"
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
 

/** @type {firebase} */


export default function Webcam() {
    
    useEffect(() => {        
        //initiateconnection();
        
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        setfirestore(firebase.firestore());
        setpc(new RTCPeerConnection(servers));
        console.log("Connection intialised");        
    }, []);

    const localstreamRef = useRef();
    const remotestreamRef = useRef();
    //var pc;
    
    const [passcode, setpasscode] = useState("");
    const [pc, setpc] = useState("");
    const [firestore, setfirestore] = useState("");

    const [startWebcamButton, setStartWebcamButton] = useState(true);    
    const [callButton, setCallButton] = useState(false);    
    const [hangupButton, setHangupButton] = useState(false);    
    


    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_APIKEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMETNID
      };


    const servers = {
        iceServers: [
            {
                urls: ["stun:stun.l.google.com:19302", 'stun:stun2.l.google.com:19302']
            }
        ],
        iceCandidatePoolSize: 20
    }
    // Initialize Firebase
    async function initiateconnection() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        setfirestore(firebase.firestore());
        console.log("Connection intialised");
        //pc = new RTCPeerConnection(servers);
    }



    //Meida streams for both local and remote video and audio
    let localstream = null;
    let remoteStream = null;


    //This is the function that is called when the user clicks the button to start the call
    async function getLocalStream() {
        localstream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        remoteStream = new MediaStream();

        localstream.getTracks().forEach(track => {
            console.log(`Found track: ${track.kind}`);            
            pc.addTrack(track, localstream);                    
        });
        console.log("Local stream added");
        localstreamRef.current.srcObject = localstream;


        pc.ontrack = (event) => {
            event.streams[0].getTracks().forEach(track => {
                remoteStream.addTrack(track);
            });
            console.log("Remote stream added");
            remotestreamRef.current.srcObject = remoteStream;
            //remotevideo.srcObject = remoteStream;
        }
        setCallButton(true);
        setStartWebcamButton(false);
        setHangupButton(true);
        console.log("Call button set to true {}", callButton);
    }

    async function startCall() {
        console.log("Starting call");
        const callDoc = firestore.collection("calls").doc();
        const offerCandidate = callDoc.collection("offerCandidates");
        const answerCandidates = callDoc.collection("answerCandidates");

        await setpasscode(callDoc.id);


        //Add a suitable ice candidate to the collections db in firestore
        pc.onicecandidate = (event) => {
            console.log(event.candidate);
            event.candidate && offerCandidate.add(event.candidate.toJSON());
        }

        //Create the offer itself
        const offerDescription = await pc.createOffer();
        await pc.setLocalDescription(offerDescription);
        console.log("Offer created");

        const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
        };


        console.log(offer);
        await callDoc.set({ offer });

        //Listen for an answer on the db
        callDoc.onSnapshot((snapshot) => {
            const data = snapshot.data();
            //If we can have to set a remote description, then do so
            if (!pc.currentRemoteDescription && data && data.answer) {
                const answerDecription = new RTCSessionDescription(data.answer);
                pc.setRemoteDescription(answerDecription);
                setHangupButton(true);
            }
        });
        // When answerCandidate is updated, add candidate to peer connection
        answerCandidates.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const candidate = new RTCIceCandidate(change.doc.data());
                    pc.addIceCandidate(candidate);
                }
            });
        });
    }

    async function answerCall() {
        const callId = document.getElementById("manualPasscode").value;
        console.log("Manual passcode is: " + callId);
        const callDoc = firestore.collection('calls').doc(callId);
        const offerCandidate = callDoc.collection("offerCandidates");
        const answerCandidates = callDoc.collection("answerCandidates");

        if(!pc){
            console.log("Something is wrong");
        }

        //Add a suitable ice candidate to the collections db in firestore
        pc.onicecandidate = (event) => {
            console.log(event.candidate);
            event.candidate && answerCandidates.add(event.candidate.toJSON());
        }
        const callData = (await callDoc.get()).data();
        console.log("Calldata: "+callData);
        const offerDecription = new RTCSessionDescription(callData.offer);
        await pc.setRemoteDescription(offerDecription);

        const answerDescription = await pc.createAnswer();
        await pc.setLocalDescription(answerDescription);

        const answer = {
            sdp: answerDescription.sdp,
            type: answerDescription.type,
        };


        console.log(answer);
        await callDoc.update({ answer });

        offerCandidate.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                console.log(change);
                if (change.type == "added") {
                    let data = change.doc.data();
                    console.log(data);
                    let candidate = new RTCIceCandidate(data);
                }
            });
        })
    }

    async function hangupCall(){
        console.log("Call successfulyl ended");
        pc.close();

        localstreamRef.current.srcObject.getTracks().forEach(track => {
            console.log(`Found track: ${track.kind}`);            
            track.stop();
        });

        const callId = document.getElementById("manualPasscode").value;
        await firestore.collection('calls').doc(callId).delete();
        
        setStartWebcamButton(true);        
        setCallButton(false);
        setpasscode("");

        remotestreamRef.current.srcObject = null;
        localstreamRef.current.srcObject = null;        

        //Since we closed the peer connection, we need to restart it with a new instance
        setpc(new RTCPeerConnection(servers));
        
    }

    return (
        <div className='flex flex-col justify-center items-center'>
            <h1 className='text-5xl p-5'>
                Work in progress check back soon.
            </h1>
            <div id="videos" className="flex flex-row" >
                <video ref={localstreamRef} id="hostVideoFeed" autoPlay playsInline muted />
                <video ref={remotestreamRef} id="guestVideoFeed" autoPlay playsInline />
            </div>
                        
            
            <div className="flex flex-col items-center">
                <h1>
                    1. Enable webcam and audio
                </h1>
                <div id="streamconnection" className="flex flex-row justify-center p-5" >
                    <button disabled={!startWebcamButton} onClick={getLocalStream} className="bg-blue-500 disabled:bg-blue-800 disabled:opacity-75 text-white rounded-full p-3">
                        Start webcam and mic
                    </button>
                </div>
                { passcode &&
                <h2 className="p-0 text-center ">
                    Passcode is {passcode} <br/>
                    Send this code to your friend to enable them to join your room.
                </h2>}
                
                
             </div>            
             <div className="flex flex-col items-center">
                <h1 className="p-5">
                    2. Start / answer call
                </h1>
                <input id="manualPasscode" className="rounded-lg border-2 border-orange-300 p-4" type="text" value={passcode} onChange={(e) => { setpasscode(e.target.value) }} />
                <div id="streamconnection" className="flex flex-row justify-between p-5" >
                    <button disabled={!callButton} onClick={startCall} className="bg-blue-500 disabled:bg-blue-800 disabled:opacity-75 text-white rounded-full w-1/2 px-10 py-2 mr-5">
                        Start call
                    </button>
                    <button disabled={!passcode} onClick={answerCall} className="bg-green-500 disabled:bg-green-800 disabled:opacity-75 text-white rounded-full w-1/2 px-10 py-2">
                        Answer call
                    </button>
                </div>
             </div>            
             <div className="flex flex-col items-center">
                <h1 className="p-2">
                    3. Hang up
                </h1>                                
                <button disabled={!hangupButton} onClick={hangupCall} className="bg-red-500 disabled:bg-red-800 disabled:opacity-75 text-white rounded-full px-5 py-2">
                    Hang up
                </button>                                
             </div>            
        </div>
    );
}




