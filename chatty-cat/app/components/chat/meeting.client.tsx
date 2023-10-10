import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, PhoneMissed } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "@remix-run/react";
import Peer from "peerjs";
import { toast } from "../ui/use-toast";
import type { User } from "~/types";

const stream = new MediaStream();

export const Meeting = ({
  id,
  user,
  participants,
}: {
  id: string;
  user: User;
  participants: User[];
}) => {
  const navigate = useNavigate();
  const localVideoStream = useRef<MediaStream>();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // a collection of all of the peers streams
  const myPeer = useRef<Peer>();

  const handleStartVideoStream = async () => {
    localVideoStream.current = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1024 },
        height: { min: 768 },
      },
    });

    stream.getTracks().forEach((track) => stream.removeTrack(track));
    stream.addTrack(localVideoStream.current.getVideoTracks()[0]);
    setIsVideoActive(true);

    participants.forEach((participant) => {
      if (participant.id === user.id || !myPeer.current) return;
      myPeer.current.call(participant.id, stream);
    });

    if (!myVideoRef.current) return;
    myVideoRef.current.srcObject = localVideoStream.current;
  };

  const handleEndVideoStream = () => {
    localVideoStream.current?.getTracks().forEach((track) => track.stop());
    setIsVideoActive(false);

    participants.forEach((participant) => {
      if (participant.id === user.id || !myPeer.current) return;
      myPeer.current.call(participant.id, stream);
    });

    if (!myVideoRef.current) return;
    myVideoRef.current.pause();
    myVideoRef.current.removeAttribute("src");
    myVideoRef.current.load();
  };

  const handleEndCall = () => {
    stream.getTracks().forEach((track) => track.stop());
    handleEndVideoStream();
    navigate("/chat");
  };

  useEffect(() => {
    if (myPeer.current) return;

    myPeer.current = new Peer(user.id);

    myPeer.current.on("disconnected", (id) => {
      console.info("[iam] disconnected", id);
      myPeer.current = undefined;
    });
    myPeer.current.on("error", console.error);

    myPeer.current.on("call", (call) => {
      // toast({ title: "Remote user has joined the call" });
      console.log("peer connected", call.peer);

      // auto answer the call for the remote connecting and broadcast our media
      call.answer(stream);

      // receive the incoming media
      call.on("stream", (remoteStream) => {
        if (!peerVideoRef.current) return;
        peerVideoRef.current.srcObject = remoteStream;
      });

      // let us know when the user leaves
      call.on("close", () => toast({ title: "Remote user has left the call" }));
    });

    myPeer.current.on("open", (id) => {
      console.info("[iam] connected", id);
    });

    return () => {
      myPeer.current?.destroy();
    };
  }, [user.id, participants]);

  return (
    <div className="w-full h-full">
      <video
        ref={myVideoRef}
        autoPlay
        className="bg-black aspect-video w-1/5 absolute bottom-10 right-10 rounded-lg drop-shadow-lg shadow-lg"
      />
      <video
        ref={peerVideoRef}
        autoPlay
        className="w-full h-full bg-black/95"
      />

      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-6 gap-3">
        {isVideoActive ? (
          <Button onClick={handleEndVideoStream} variant="outline" size="icon">
            <Video />
          </Button>
        ) : (
          <Button
            onClick={handleStartVideoStream}
            variant="outline"
            size="icon"
          >
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
