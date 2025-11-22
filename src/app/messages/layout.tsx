
import { AuthWrapper } from "@/components/auth/auth-wrapper";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
        <div className="chat-theme h-[calc(100vh-4rem)] bg-background text-foreground p-4">
            <div className="h-full border rounded-lg overflow-hidden bg-card/50 backdrop-blur-xl">
                 {children}
            </div>
        </div>
    </AuthWrapper>
  );
}
