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
    <Card>
      <CardHeader>
        <CardTitle>Hey {name} 👋</CardTitle>
      </CardHeader>
      <CardContent>Lets start chatting!</CardContent>
      <CardFooter className="flex gap-10 flex-col items-start">
        <Form method="post">
          <Button name="actionId" value="new-meeting">
            New meeting
          </Button>
        </Form>
        <Form method="post" className="flex flex-col gap-3">
          Friend sent you a code?
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
