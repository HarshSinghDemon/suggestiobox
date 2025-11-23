
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
            src="https://ik.imagekit.io/bt0k47tzc/kermit_the_frog_muppets_minimalism_simple_background_purple_87910_1920x1080.jpg?updatedAt=1721111666632"
            alt="Abstract purple background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/60" />
          <main className="absolute inset-0 flex flex-col">{children}</main>
        </div>
      </ImageKitProvider>
    </AuthWrapper>
  );
}
