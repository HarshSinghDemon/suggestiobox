
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import type { FirebaseUser } from "./types";
import { generateAndExportKey } from "./e2ee";

/**
 * Finds an existing 1-on-1 chat room between two users, or creates a new one if it doesn't exist.
 * This version also generates a shared AES session key for the chat.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The ID of the currently logged-in user.
 * @param otherUserId - The ID of the user to chat with.
 * @returns The ID of the chat room.
 */
export async function findOrCreateChat(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<string> {
    const currentUserDocRef = doc(firestore, 'users', currentUserId);
    const otherUserDocRef = doc(firestore, 'users', otherUserId);
    
    const [currentUserSnap, otherUserSnap] = await Promise.all([
        getDoc(currentUserDocRef),
        getDoc(otherUserDocRef)
    ]);

    if (!currentUserSnap.exists() || !otherUserSnap.exists()) {
        throw new Error("One or both users could not be found.");
    }
    
    const currentUserData = currentUserSnap.data() as FirebaseUser;

    // Admins can bypass the friend check.
    if (currentUserData.role !== 'admin' && !currentUserData.friends?.includes(otherUserId)) {
        throw new Error("You can only chat with your friends.");
    }
    
    const chatRoomsRef = collection(firestore, "chatRooms");
    
    // Check if a chat room already exists between these two users.
    const q = query(chatRoomsRef, where("participants", "in", [[currentUserId, otherUserId], [otherUserId, currentUserId]]));

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
        // Chat room already exists
        return querySnapshot.docs[0].id;
    } else {
        // Generate a new AES key for this session
        const sessionKeyBase64 = await generateAndExportKey();

        // Create a new chat room
        const newRoomData = {
            participants: [currentUserId, otherUserId],
            createdAt: serverTimestamp(),
            lastMessage: null,
            sessionKey_b64: sessionKeyBase64,
        };
        const newRoomRef = await addDoc(chatRoomsRef, newRoomData);
        
        // Atomically update both user documents with the new chat room ID
        await Promise.all([
            updateDoc(currentUserDocRef, {
                chatRoomIds: arrayUnion(newRoomRef.id)
            }),
            updateDoc(otherUserDocRef, {
                chatRoomIds: arrayUnion(newRoomRef.id)
            })
        ]);

        return newRoomRef.id;
    }
}
