
'use client';

// Placeholder for the group chat room page
export default function GroupChatPage({ params }: { params: { groupId: string } }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-white">
            <h1 className="text-2xl font-bold">Group Chat</h1>
            <p>Group ID: {params.groupId}</p>
            <p className="mt-4 text-white/70">This feature is under construction.</p>
        </div>
    );
}
