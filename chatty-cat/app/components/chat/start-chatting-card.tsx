import { Form, useActionData, useNavigate } from "@remix-run/react";
import Peer from "peerjs";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { toast } from "../ui/use-toast";
import { useEffect } from "react";

export const StartChattingCard = ({ name }: { name: string }) => {
  const navigate = useNavigate();
  const data = useActionData<{ errors?: { code: string } }>();

  const handleNewMeetingClick = async () => {
    const peer = new Peer();

    const peerIdPromise: Promise<string> = new Promise((resolve, reject) => {
      peer.on("open", resolve);
      peer.on("error", reject);
    });

    try {
      const peerId = await peerIdPromise;
      navigate(`/chat/${peerId}`);
    } catch {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem creating the room.",
      });
    }
  };

  useEffect(() => {
    data?.errors?.code &&
      toast({
        variant: "destructive",
        title: data.errors.code,
      });
  }, [data]);

  return (
    <Card className="w-min-content">
      <CardHeader>
        <CardTitle>Hey {name} 👋</CardTitle>
      </CardHeader>
      <CardContent>Lets start chatting!</CardContent>
      <CardFooter className="flex justify-between gap-10">
        <Button
          onClick={handleNewMeetingClick}
          name="actionId"
          value="new-meeting"
        >
          New meeting
        </Button>
        <Form method="post">
          <div className="flex gap-2">
            <Input placeholder="Enter a meeting code" name="code" />
            <Button variant="ghost">Join</Button>
          </div>
        </Form>
      </CardFooter>
    </Card>
  );
};
