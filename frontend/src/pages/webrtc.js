import React, { useEffect, useState } from 'react';

// Function to fetch WebRTC stream
export async function fetchWebRTCStream(videoElement, rtspUrl) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  });

  const stream = new MediaStream();
  pc.ontrack = (event) => stream.addTrack(event.track);
  videoElement.srcObject = stream;

  pc.addTransceiver('video', { direction: 'recvonly' });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const res = await fetch('http://localhost:5050/offer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sdp: offer.sdp,
      type: offer.type,
      rtspUrl,
    }),
  });

  if (!res.ok) throw new Error(`Offer failed: ${res.statusText}`);
  const answer = await res.json();
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

// Function to create a WebRTC peer connection
const createPeerConnection = (config = {}) => {
  const pc = new RTCPeerConnection(config);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('New ICE candidate:', event.candidate);
      sendSignalingMessage({
        type: 'ice-candidate',
        candidate: event.candidate,
      });
    }
  };

  pc.ontrack = (event) => {
    console.log('Received stream:', event.streams[0]);
    const remoteStream = event.streams[0];
    const videoElement = document.getElementById('remoteVideo');
    if (videoElement) {
      videoElement.srcObject = remoteStream;
    }
  };

  return pc;
};

// Function to send signaling messages (to WebSocket or signaling server)
const sendSignalingMessage = (message) => {
  console.log('Sending signaling message:', message);
  // Implement WebSocket or HTTP to send the signaling message
  // Example:
  // socket.emit("message", message);
};

// Function to create an offer (invitation to start WebRTC communication)
const createOffer = async (pc) => {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignalingMessage({ type: 'offer', offer });
    return offer;
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

// Function to configure ICE servers (STUN/TURN servers)
const configureICE = () => {
  const iceServers = [
    {
      urls: 'stun:stun.l.google.com:19302', // Common public STUN server
    },
    {
      urls: 'turn:your.turn.server', // If you have a TURN server
      username: 'your-username',
      credential: 'your-credential',
    },
  ];
  return { iceServers };
};

// Main React component for WebRTC
const WebRTCApp = () => {
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [pc, setPc] = useState(null);

  useEffect(() => {
    const initWebRTC = async () => {
      try {
        const pcConfig = configureICE();
        const peerConnection = createPeerConnection(pcConfig);
        setPc(peerConnection);

        // Fetch local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Attach the local stream to the video element
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
          localVideo.srcObject = stream;
        }

        // Add the local stream to the peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        // Create an offer and send it to the remote peer
        await createOffer(peerConnection);

      } catch (err) {
        console.error('Error initializing WebRTC:', err);
      }
    };

    initWebRTC();

    return () => {
      if (pc) {
        pc.close();
      }
    };
  }, [pc]); // Adding pc as a dependency to avoid missing dependency warning

  const handleStartWebRTC = async () => {
    const videoElement = document.getElementById('remoteVideo');
    if (videoElement) {
      await fetchWebRTCStream(videoElement, 'rtsp://your-rtsp-stream-url');
    }
    setIsVideoStarted(true);
  };

  return (
    <div>
      <h2>WebRTC Video Communication</h2>
      <div>
        <video
          id="localVideo"
          autoPlay
          muted
          style={{ width: '300px', height: 'auto' }}
        ></video>
        <video
          id="remoteVideo"
          autoPlay
          style={{ width: '300px', height: 'auto' }}
        ></video>
      </div>
      {!isVideoStarted ? (
        <button onClick={handleStartWebRTC}>Start WebRTC</button>
      ) : (
        <p>Video started!</p>
      )}
    </div>
  );
};

// Exporting the WebRTCApp as default
export default WebRTCApp;
