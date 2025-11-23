
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
            src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop"
            alt="Purple nebula"
            fill
            className="object-cover"
            priority
            data-ai-hint="space nebula"
          />
          <div className="absolute inset-0 bg-black/50" />
          <main className="absolute inset-0 flex flex-col">{children}</main>
        </div>
      </ImageKitProvider>
    </AuthWrapper>
  );
}
