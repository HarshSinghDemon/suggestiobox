
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import type { FirebaseUser } from "./types";

/**
 * Finds an existing 1-on-1 chat room between two users, or creates a new one if it doesn't exist.
 * This version also updates the user documents with the new chat room ID.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The ID of the currently logged-in user.
 * @param otherUserId - The ID of the user to chat with.
 * @returns The ID of the chat room.
 */
export async function findOrCreateChat(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<string> {
    const currentUserDocRef = doc(firestore, 'users', currentUserId);
    const currentUserDoc = await getDoc(currentUserDocRef);
    const currentUserData = currentUserDoc.data() as FirebaseUser;
    
    // Check if users are friends before creating or finding a chat
    if (!currentUserData.friends?.includes(otherUserId)) {
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
        // Create a new chat room
        const newRoomData = {
            participants: [currentUserId, otherUserId],
            createdAt: serverTimestamp(),
            lastMessage: null
        };
        const newRoomRef = await addDoc(chatRoomsRef, newRoomData);
        
        // Atomically update both user documents with the new chat room ID
        const otherUserDocRef = doc(firestore, 'users', otherUserId);
        
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
