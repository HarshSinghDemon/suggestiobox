
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

/**
 * Finds an existing 1-on-1 chat room between two users, or creates a new one if it doesn't exist.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The ID of the currently logged-in user.
 * @param otherUserId - The ID of the user to chat with.
 * @returns The ID of the chat room.
 */
export async function findOrCreateChat(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<string> {
    const chatRoomsRef = collection(firestore, "chatRooms");
    
    // To query for the room, we need to check both ordering of participants
    const q1 = query(chatRoomsRef, where("participants", "==", [currentUserId, otherUserId]));
    const q2 = query(chatRoomsRef, where("participants", "==", [otherUserId, currentUserId]));

    const [querySnapshot1, querySnapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    
    const existingChats = [...querySnapshot1.docs, ...querySnapshot2.docs];

    if (existingChats.length > 0) {
        // Chat room already exists
        return existingChats[0].id;
    } else {
        // Create a new chat room
        const newRoomData = {
            participants: [currentUserId, otherUserId],
            createdAt: serverTimestamp(),
            lastMessage: null
        };
        const newRoomRef = await addDoc(chatRoomsRef, newRoomData);
        return newRoomRef.id;
    }
}
