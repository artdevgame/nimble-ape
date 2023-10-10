import { useRef, useState } from "react";
import { Video, VideoOff, PhoneMissed } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "@remix-run/react";

export const LocalStream = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream>();
  const [isStreamActive, setIsStreamActive] = useState(false);

  const handleStartStream = async () => {
    if (!videoRef.current) return;
    stream.current = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1024 },
        height: { min: 768 },
      },
    });
    videoRef.current.srcObject = stream.current;
    setIsStreamActive(stream.current.active);
  };

  const handleEndStream = () => {
    setIsStreamActive(false);
    if (!stream.current) return;
    stream.current.getTracks().forEach((track) => track.stop());
  };

  const handleEndCall = () => {
    handleEndStream();
    navigate("/chat");
  };

  return (
    <div className="w-full h-full">
      <video ref={videoRef} autoPlay className="w-full h-full bg-black" />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-6 gap-3">
        {isStreamActive ? (
          <Button onClick={handleEndStream} variant="outline" size="icon">
            <Video />
          </Button>
        ) : (
          <Button onClick={handleStartStream} variant="outline" size="icon">
            <VideoOff />
          </Button>
        )}
        <Button onClick={handleEndCall} variant="destructive" size="icon">
          <PhoneMissed />
        </Button>
      </div>
    </div>
  );
};
