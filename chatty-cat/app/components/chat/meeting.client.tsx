import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneMissed, icons } from "lucide-react";
import { Button } from "../ui/button";
import { useFetcher, useNavigate } from "@remix-run/react";
import Peer from "peerjs";
import type { User } from "~/types";
import { default as QrScanner } from "qr-scanner";
import { getTime, parse } from "date-fns";

const videoStream = new MediaStream();
const canvasStream = createBlankVideoStream();

// 16:9
const videoDimensions = { width: 640, height: 360 };

let latencyTimeout: ReturnType<typeof setTimeout>;

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
  const [latency, setLatency] = useState<number>();
  const previousLatency = useRef<number>();

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

  const computeLatency = (extractedTimestamp: string, arrived: number) => {
    const rawDate = extractedTimestamp.split("oT")[1];
    const parsedDate = parse(rawDate, "yyMMddHHmmss.SSS", Date.now());
    const now = getTime(parsedDate);

    if (isNaN(now)) return;
    setLatency(now - arrived);
  };

  const handleStartVideoStream = async () => {
    if (!myVideoRef.current) return;

    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { min: videoDimensions.width },
        height: { min: videoDimensions.height },
      },
    });
    const cameraTrack = cameraStream.getVideoTracks()[0];

    videoStream.getVideoTracks().forEach((track) => {
      track.stop();
      videoStream.removeTrack(track);
    });

    if (
      "MediaStreamTrackProcessor" in window &&
      "MediaStreamTrackGenerator" in window
    ) {
      // @ts-ignore
      const trackProcessor = new MediaStreamTrackProcessor({
        track: cameraTrack,
      });
      // @ts-ignore
      const trackGenerator = new MediaStreamTrackGenerator({ kind: "video" });
      const transformer = new TransformStream({
        async transform(cameraFrame, controller) {
          const arrived = Date.now();
          const bitmap = await createImageBitmap(cameraFrame);

          try {
            const result = await QrScanner.scanImage(bitmap, {
              returnDetailedScanResult: true,
            });
            computeLatency(result.data, arrived);
          } catch {
            // no qr code found
          } finally {
            bitmap.close();
          }
          controller.enqueue(cameraFrame);
        },
        flush(controller) {
          controller.terminate();
        },
      });
      trackProcessor.readable
        .pipeThrough(transformer)
        .pipeTo(trackGenerator.writable);

      videoStream.addTrack(
        new MediaStream([trackGenerator]).getVideoTracks()[0]
      );
    } else {
      videoStream.addTrack(cameraTrack);
    }

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
    clearTimeout(latencyTimeout);
    latencyTimeout = setTimeout(() => {
      if (latency && previousLatency.current === latency) {
        setLatency(undefined);
      }
    }, 800);
    previousLatency.current = latency;
  }, [latency]);

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
      <div className="w-1/5 absolute bottom-10 right-10">
        {latency && (
          <strong className="z-10 absolute -top-4 -right-4 text-2xl bg-pink-500 rounded-lg px-2.5 py-1.5 shadow-lg drop-shadow-lg">
            {latency}
          </strong>
        )}
        <video
          ref={myVideoRef}
          autoPlay
          className="bg-black aspect-video rounded-lg drop-shadow-lg shadow-lg"
        />
      </div>
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
  const width = 640;
  const height = 480;

  const canvas = Object.assign(
    document.createElement("canvas"),
    videoDimensions
  );

  canvas.getContext("2d")!.fillRect(0, 0, width, height);

  const stream = canvas.captureStream();

  return stream;
}
