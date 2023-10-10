import { Form, useActionData } from "@remix-run/react";
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
  const data = useActionData<{ errors?: { code: string } }>();

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
        <Form method="post">
          <Button name="actionId" value="new-meeting">
            New meeting
          </Button>
        </Form>
        <Form method="post">
          <div className="flex gap-2">
            <Input placeholder="Enter a meeting code" name="code" />
            <Button variant="ghost" name="actionId" value="join-meeting">
              Join
            </Button>
          </div>
        </Form>
      </CardFooter>
    </Card>
  );
};
