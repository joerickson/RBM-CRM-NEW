import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B4F8A] to-[#0D2E54] p-4">
      <SignIn />
    </div>
  );
}
