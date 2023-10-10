import { Form } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";

export const StartChattingCard = ({ name }: { name: string }) => {
  return (
    <Card className="w-min-content">
      <CardHeader>
        <CardTitle>Hey {name} 👋</CardTitle>
      </CardHeader>
      <CardContent>Lets start chatting!</CardContent>
      <CardFooter className="flex justify-between gap-10">
        <Form method="post">
          <Button name="actionId" value="new-meeting">
            New meeting
          </Button>
        </Form>
        <Form method="post">
          <div className="flex gap-3">
            <Input placeholder="Enter a meeting code" />
            <Button name="actionId" value="existing-meeting" variant="outline">
              Join
            </Button>
          </div>
        </Form>
      </CardFooter>
    </Card>
  );
};
