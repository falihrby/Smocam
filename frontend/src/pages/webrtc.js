// webrtc.js

/**
 * Establishes a WebRTC connection to stream video from an RTSP URL via a backend relay.
 *
 * @param {HTMLVideoElement} videoElement - The HTML video element to display the stream.
 * @param {string} rtspUrl - The RTSP URL of the camera stream.
 * @param {string} backendOfferUrl - The URL of the backend endpoint that handles the WebRTC offer. (Default: 'http://localhost:5050/offer')
 * @returns {Promise<RTCPeerConnection>} A promise that resolves with the RTCPeerConnection object
 * when the connection is successfully established and media is flowing,
 * or rejects with an Error if the setup fails.
 */
export async function fetchWebRTCStream(videoElement, rtspUrl, backendOfferUrl = 'http://192.168.1.4:5050/offer') {
  console.log(`[WebRTC] Initializing WebRTC stream for: ${rtspUrl} via ${backendOfferUrl}`);
  
  // Return a new promise that encapsulates the entire WebRTC lifecycle
  return new Promise((resolve, reject) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], // Standard STUN server
    });

    let streamResolved = false; // Flag to prevent multiple resolves/rejects
    // Attempt to reuse existing stream or create a new one
    let currentStream = videoElement.srcObject instanceof MediaStream ? videoElement.srcObject : new MediaStream();

    // Cleanup function
    const cleanup = (errorMsg) => {
      // Allow cleanup on error even if resolved, but don't reject if already resolved without error
      if (streamResolved && !errorMsg) return; 
      
      const isError = !!errorMsg;
      if (isError && streamResolved) { // If an error occurs after successful resolution
        console.warn(`[WebRTC] Error after stream resolution for ${rtspUrl}: ${errorMsg}. Connection might have been closed already.`);
      } else if (isError) {
        streamResolved = true; // Mark as handled if error occurs before resolution
      }


      console.warn(`[WebRTC] Cleaning up connection for ${rtspUrl}. Reason: ${errorMsg || 'Normal cleanup'}`);
      if (pc.signalingState !== 'closed') {
        pc.close();
      }
      // Only clear srcObject if it's the one we set up, to avoid interfering with other video elements
      if (videoElement && videoElement.srcObject === currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null; 
      }
      if (isError && !streamResolved) { // Ensure reject is only called once if not already resolved
         reject(new Error(errorMsg));
      } else if (isError && streamResolved && pc.connectionState !== 'connected' && pc.connectionState !== 'completed') {
        // If it was resolved but then an error occurred before true connection, reject.
        // This handles cases where ontrack fires but connection later fails.
        reject(new Error(errorMsg));
      }
    };

    pc.ontrack = (event) => {
      console.log(`[WebRTC] 🔥 ontrack: ${event.track.kind} for RTSP URL: ${rtspUrl}`);
      if (!(currentStream instanceof MediaStream)) { // Ensure currentStream is valid
        currentStream = new MediaStream();
      }
      
      // Remove old tracks of the same kind to prevent duplicates if ontrack fires multiple times
      currentStream.getTracks().filter(t => t.kind === event.track.kind).forEach(t => {
        currentStream.removeTrack(t);
        t.stop(); // Stop the old track
      });
      currentStream.addTrack(event.track);

      if (videoElement.srcObject !== currentStream) {
        videoElement.srcObject = currentStream;
      }
      console.log(`[WebRTC] Assigned/updated stream to video element for ${rtspUrl}.`);
      
      // Attempt to play when track is received and metadata might be loading
      videoElement.onloadedmetadata = () => {
        console.log(`[WebRTC] Video metadata loaded for ${rtspUrl}. Dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}.`);
        videoElement.play()
          .then(() => {
            console.log(`[WebRTC] Video playback initiated for ${rtspUrl}. Waiting for 'connected' state.`);
            // Actual resolution of the promise is handled by onconnectionstatechange 'connected'
          })
          .catch(err => {
            console.error(`[WebRTC] Video play() FAILED for ${rtspUrl}:`, err);
            cleanup(`Video play() failed: ${err.name} - ${err.message}`);
          });
      };
    };

    // Video element specific errors
    videoElement.onerror = (e) => {
      console.error(`[WebRTC] Video element error event for ${rtspUrl}. Code: ${videoElement.error?.code}, Message: ${videoElement.error?.message}`, e);
      cleanup(`Video element error: ${videoElement.error?.message || 'Unknown video error'} (Code: ${videoElement.error?.code})`);
    };
    videoElement.onstalled = () => console.warn(`[WebRTC] Video stalled for ${rtspUrl}.`);
    videoElement.onwaiting = () => console.warn(`[WebRTC] Video waiting for data for ${rtspUrl}.`);

    // ICE and Connection state listeners
    pc.onicecandidate = (event) => {
      // if (event.candidate) console.debug(`[WebRTC] ICE candidate for ${rtspUrl}:`, event.candidate.candidate.substring(0, 70) + "...");
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state change for ${rtspUrl}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'failed') {
        cleanup(`ICE connection failed for ${rtspUrl}`);
      } else if (pc.iceConnectionState === 'closed') {
        // This is a normal state after pc.close() is called.
        // cleanup(`ICE connection closed for ${rtspUrl}`); // Avoid redundant cleanup call if already handled
      } else if (pc.iceConnectionState === 'disconnected') {
        console.warn(`[WebRTC] ICE connection for ${rtspUrl} is disconnected. This might be temporary. Monitoring peer connection state.`);
        // Rely on onconnectionstatechange for more definitive failure.
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Peer Connection state change for ${rtspUrl}: ${pc.connectionState}`);
      if ((pc.connectionState === 'connected' || pc.connectionState === 'completed')) {
        if (!streamResolved) {
          console.log(`[WebRTC] Peer connection for ${rtspUrl} is ${pc.connectionState}. Resolving with PC object.`);
          streamResolved = true;
          resolve(pc); 
        }
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanup(`Peer connection ${pc.connectionState} for ${rtspUrl}`);
      } else if (pc.connectionState === 'disconnected') {
        console.warn(`[WebRTC] Peer connection for ${rtspUrl} is disconnected. Monitoring...`);
        // Consider a timeout here to declare failure if it doesn't reconnect.
      }
    };

    // Add video transceiver to receive video
    pc.addTransceiver('video', { direction: 'recvonly' });

    // Asynchronous part: create offer, send to backend, set remote answer
    (async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log(`[WebRTC] Sending offer for ${rtspUrl} to backend (${backendOfferUrl})...`);
        const res = await fetch(backendOfferUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sdp: offer.sdp,
            type: offer.type,
            rtspUrl, // Send the RTSP URL to the backend
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[WebRTC] Offer request to backend failed for ${rtspUrl}: ${res.status} ${res.statusText}`, errorText);
          throw new Error(`Offer to backend failed: ${res.status} ${res.statusText}. Response: ${errorText}`);
        }

        const answer = await res.json();
        // Check if backend returned a specific error in the JSON response
        if (answer.error) { 
            console.error(`[WebRTC] Backend returned an error for ${rtspUrl}: ${answer.error}`);
            throw new Error(`Backend error: ${answer.error}`);
        }

        console.log(`[WebRTC] Received answer for ${rtspUrl} from backend.`);
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(`[WebRTC] Remote description set for ${rtspUrl}. WebRTC setup process initiated. Waiting for connection...`);
        // The promise will now resolve/reject based on pc.onconnectionstatechange events.
      } catch (error) {
        console.error(`[WebRTC] Error during WebRTC setup signaling for ${rtspUrl}:`, error);
        cleanup(`Setup signaling error: ${error.message}`);
      }
    })();
  });
}
