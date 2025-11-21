
import { Firestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import type { FirebaseUser } from "./types";
import { encryptMessage } from "./e2ee";

/**
 * Finds an existing 1-on-1 chat room between two users, or creates a new one if it doesn't exist.
 * This version uses session-based key encryption.
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
    const otherUserData = otherUserSnap.data() as FirebaseUser;

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
        // Create a new chat room and a session key
        const sessionKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        if (!currentUserData.encryptionPublicKey || !otherUserData.encryptionPublicKey) {
            throw new Error("One or both users are missing public keys for secure session setup.");
        }

        // Encrypt the session key for each participant with their public key
        const encryptedKeyForCurrentUser = await encryptMessage(currentUserData.encryptionPublicKey, JSON.stringify(await window.crypto.subtle.exportKey('jwk', sessionKey)));
        const encryptedKeyForOtherUser = await encryptMessage(otherUserData.encryptionPublicKey, JSON.stringify(await window.crypto.subtle.exportKey('jwk', sessionKey)));

        const newRoomData = {
            participants: [currentUserId, otherUserId],
            createdAt: serverTimestamp(),
            lastMessage: null,
            sessionKeys: {
                [currentUserId]: encryptedKeyForCurrentUser,
                [otherUserId]: encryptedKeyForOtherUser
            }
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
