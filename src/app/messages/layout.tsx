
import { AuthWrapper } from "@/components/auth/auth-wrapper";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
        <div className="chat-theme relative h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden p-4">
            <div className="fixed inset-0 bg-chat-background -z-10" />
            <div className="relative z-10 h-full rounded-2xl overflow-hidden glass-pane">
                {children}
            </div>
        </div>
    </AuthWrapper>
  );
}
