import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/signup-form";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Create an account to start sharing and discovering.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <SignUpForm />
          </div>
          <div className="mt-4 text-sm text-center">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
