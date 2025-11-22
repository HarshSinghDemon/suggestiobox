
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
        <div className="chat-theme relative h-[calc(100vh)] bg-background text-foreground overflow-hidden">
            <div className="fixed inset-0 bg-chat-background -z-10" />
            <div className="relative z-10 h-full flex flex-col p-4">
                <ChatHeader />
                <div className="flex-1 min-h-0 rounded-b-2xl overflow-hidden glass-pane border-t-0 rounded-t-none bg-transparent">
                    {children}
                </div>
            </div>
        </div>
      </ImageKitProvider>
    </AuthWrapper>
  );
}
