
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ImageKitProvider } from "@/lib/imagekit/imagekit-provider";
import Image from "next/image";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <ImageKitProvider>
        <div className="relative h-screen w-full overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2070&auto=format&fit=crop"
            alt="Abstract purple and blue background"
            fill
            className="object-cover"
            priority
            data-ai-hint="abstract gradient"
          />
          <div className="absolute inset-0 bg-black/50" />
          <main className="absolute inset-0 flex flex-col">{children}</main>
        </div>
      </ImageKitProvider>
    </AuthWrapper>
  );
}
