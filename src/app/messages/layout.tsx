
import { AuthWrapper } from "@/components/auth/auth-wrapper";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper>
        <div className="chat-theme relative h-[calc(100vh-4rem)] bg-background text-foreground overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
                <div className="absolute bottom-0 right-[-20%] top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,182,.15),rgba(255,255,255,0))]"></div>
            </div>
            <div className="relative z-10 h-full p-4">
                <div className="h-full border rounded-lg overflow-hidden bg-card/50 backdrop-blur-xl">
                    {children}
                </div>
            </div>
        </div>
    </AuthWrapper>
  );
}
