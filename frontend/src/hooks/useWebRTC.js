import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
 
];

export function useWebRTC() {
  const { authUser, socket } = useAuthStore();
  const { activeCall, setActiveCall, endActiveCall } = useChatStore();

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const peerRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);


  useEffect(() => {
    if (!socket) return;

  
    socket.on("incomingCall", ({ callerId, callerName, type }) => {
      setActiveCall({
        callId: `${callerId}-${Date.now()}`,
        callerId,
        receiverId: authUser._id,
        type,
        incoming: true,
      });
    });

   
    socket.on("callAccepted", ({ receiverId }) => {
      setActiveCall((prev) => ({ ...prev, accepted: true }));
    });

 
    socket.on("callRejected", ({ receiverId }) => {
      endCall();
    });

    
    socket.on("callEnded", ({ userId }) => {
      endCall();
    });

 
    socket.on("webrtcOffer", async ({ senderId, offer }) => {
      if (!peerRef.current) await createPeerConnection(senderId);

      await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);

      socket.emit("webrtcAnswer", { receiverId: senderId, answer });
    });

    socket.on("webrtcAnswer", async ({ senderId, answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidate", async ({ senderId, candidate }) => {
      if (peerRef.current && candidate) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("callEnded");
      socket.off("webrtcOffer");
      socket.off("webrtcAnswer");
      socket.off("iceCandidate");
    };
  }, [socket, authUser]);

 
  async function createPeerConnection(otherUserId) {
    peerRef.current = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    
    localStreamRef.current = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current.getTracks().forEach((track) => {
      peerRef.current.addTrack(track, localStreamRef.current);
    });

    peerRef.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStreamRef.current.addTrack(track);
      });
    };

   
    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { receiverId: otherUserId, candidate: event.candidate });
      }
    };

    return peerRef.current;
  }

  async function startCall(receiverId, type = "video") {
    if (!socket) return;

  
    socket.emit("startCall", { receiverId, type });


    await createPeerConnection(receiverId);

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);


    socket.emit("webrtcOffer", { receiverId, offer });

    setActiveCall({
      callId: `${receiverId}-${Date.now()}`,
      callerId: authUser._id,
      receiverId,
      type,
      outgoing: true,
    });
  }

  async function acceptCall() {
    if (!activeCall || !socket) return;

    await createPeerConnection(activeCall.callerId);

    socket.emit("acceptCall", { callerId: activeCall.callerId });
    setActiveCall((prev) => ({ ...prev, accepted: true }));
  }


  function endCall() {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = new MediaStream();

    if (activeCall && socket) {
      const otherUserId = activeCall.callerId === authUser._id ? activeCall.receiverId : activeCall.callerId;
      socket.emit("endCall", { otherUserId });
    }

    endActiveCall();
  }

  function toggleMute() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMuted(!isMuted);
  }

  function toggleVideo() {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsVideoOff(!isVideoOff);
  }

  return {
    localStreamRef,
    remoteStreamRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
  };
}
