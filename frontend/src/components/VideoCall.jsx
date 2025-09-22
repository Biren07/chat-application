import React, { useEffect, useRef } from "react";
import { useWebRTC } from "../hooks/useWebRTC";
import { useChatStore } from "../store/useChatStore";

export default function VideoCall() {
  const {
    localStreamRef,
    remoteStreamRef,
    startCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
  } = useWebRTC();

  const { activeCall } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);


  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  }, [localStreamRef.current, remoteStreamRef.current]);


  if (!activeCall) return null;

  const isIncoming = activeCall.incoming && !activeCall.accepted;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="flex gap-4 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-96 h-64 bg-gray-900 rounded-xl"
        />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-48 h-32 bg-gray-800 rounded-lg absolute bottom-4 right-4"
        />
      </div>

      <div className="flex gap-4 mt-6">
        {isIncoming ? (
          <>
            <button
              onClick={acceptCall}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Accept Call
            </button>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={toggleVideo}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg"
            >
              {isVideoOff ? "Turn Video On" : "Turn Video Off"}
            </button>
            <button
              onClick={endCall}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              End Call
            </button>
          </>
        )}
      </div>

      {isIncoming && (
        <div className="mt-4 text-white">
          Incoming {activeCall.type} call from {activeCall.callerId}
        </div>
      )}
    </div>
  );
}
