
import { AuthWrapper } from "@/components/auth/auth-wrapper";
import { ChatHeader } from "@/components/p2p-chat/chat-header";
import { ImageKitProvider } from "@/lib/imagekit/imagekit-provider";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
      <ImageKitProvider>
        <div className="chat-theme relative h-screen bg-background text-foreground flex flex-col">
            <div className="fixed inset-0 bg-chat-background -z-10" />
            <div className="relative z-10 flex flex-col flex-1 h-full min-h-0">
                {children}
            </div>
        </div>
      </ImageKitProvider>
    </AuthWrapper>
  );
}
