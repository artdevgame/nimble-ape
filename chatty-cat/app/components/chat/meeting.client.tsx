import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneMissed, icons } from "lucide-react";
import { Button } from "../ui/button";
import { useFetcher, useNavigate } from "@remix-run/react";
import Peer from "peerjs";
import type { User } from "~/types";

const videoStream = new MediaStream();
const canvasStream = createBlankVideoStream();

export const Meeting = ({
  id,
  myUser,
  participants,
}: {
  id: string;
  myUser: User;
  participants: User[];
}) => {
  const fetcher = useFetcher();
  const navigate = useNavigate();

  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);

  const [showVideo, setShowVideo] = useState(videoStream.active);

  const myPeer = useRef<Peer>();
  const otherUsers = useRef(
    participants
      .filter((participant) => participant.id !== myUser.id)
      .map((p) => p.id)
  );

  const refreshBroadcast = useCallback(() => {
    otherUsers.current.forEach((peerId) => {
      if (peerId === myUser.id || !myPeer.current) return;

      // todo: if the remote user quits the browser, they will still
      // be in the database and we'll still try to connect here when toggling
      // our video (will also happen if we reload the page)
      const call = myPeer.current.call(peerId, videoStream);

      // receive the incoming media when we join the chat for the first time
      call.on("stream", (remoteStream) => {
        if (!peerVideoRef.current) return;
        peerVideoRef.current.srcObject = remoteStream;
      });
    });
  }, [myUser.id]);

  const handleStartVideoStream = async () => {
    if (!myVideoRef.current) return;
    const track = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: 1920 },
        height: { min: 1080 },
      },
    });
    videoStream.removeTrack(canvasStream.getVideoTracks()[0]);
    videoStream.addTrack(track.getVideoTracks()[0]);

    myVideoRef.current.srcObject = videoStream;

    setShowVideo(true);
    refreshBroadcast();
  };

  const handleStopVideoStream = () => {
    if (!myVideoRef.current) return;
    videoStream.getVideoTracks().forEach((track) => {
      track.stop();
      videoStream.removeTrack(track);
    });

    videoStream.addTrack(canvasStream.getVideoTracks()[0]);

    setShowVideo(false);
    refreshBroadcast();
  };

  const handleEndCall = () => {
    fetcher.submit(
      {
        actionId: "remove-meeting-participant",
        meetingId: id,
        userId: myUser.id,
      },
      { method: "get" }
    );
    handleStopVideoStream();
    navigate("/chat");
  };

  const videoButton = showVideo
    ? { icon: icons["Video"], onClick: handleStopVideoStream }
    : { icon: icons["VideoOff"], onClick: handleStartVideoStream };

  useEffect(() => {
    videoStream.addTrack(canvasStream.getVideoTracks()[0]);
    return () => {
      videoStream.removeTrack(canvasStream.getVideoTracks()[0]);
    };
  }, []);

  useEffect(() => {
    if (myPeer.current) return;

    myPeer.current = new Peer(myUser.id);

    myPeer.current.on("open", (peerId) => {
      console.info("[iam] connected", peerId);
      refreshBroadcast();
    });

    myPeer.current.on("disconnected", (peerId) => {
      console.info("[iam] disconnected", peerId);
      myPeer.current = undefined;
    });

    myPeer.current.on("error", console.error);

    myPeer.current.on("call", (call) => {
      // add the new peer to our list of known peers
      otherUsers.current = otherUsers.current
        .filter((userId) => userId !== call.peer)
        .concat(call.peer);

      // send our current stream contents to remote
      call.answer(videoStream);

      // receive incoming media when it changes state
      call.on("stream", (remoteStream) => {
        if (!peerVideoRef.current) return;
        peerVideoRef.current.srcObject = remoteStream;
      });
    });

    return () => {
      myPeer.current?.destroy();
    };
  }, [myUser.id, refreshBroadcast]);

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
        <Button onClick={videoButton.onClick} variant="outline" size="icon">
          <videoButton.icon />
        </Button>
        <Button onClick={handleEndCall} variant="destructive" size="icon">
          <PhoneMissed />
        </Button>
      </div>
    </div>
  );
};

function createBlankVideoStream() {
  // we use the blank canvas track to ensure there is always something to
  // broadcast to the other participants when they join the meeting
  const width = 1920;
  const height = 1080;

  const canvas = Object.assign(document.createElement("canvas"), {
    width,
    height,
  });

  canvas.getContext("2d")!.fillRect(0, 0, width, height);

  const stream = canvas.captureStream();

  return stream;
}
