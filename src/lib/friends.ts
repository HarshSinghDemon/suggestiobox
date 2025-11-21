
import { Firestore, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * Sends a friend request from one user to another.
 * @param firestore - The Firestore instance.
 * @param fromUserId - The ID of the user sending the request.
 * @param toUserId - The ID of the user receiving the request.
 */
export async function sendFriendRequest(firestore: Firestore, fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
        throw new Error("You cannot send a friend request to yourself.");
    }
    const fromUserRef = doc(firestore, 'users', fromUserId);
    const toUserRef = doc(firestore, 'users', toUserId);

    await Promise.all([
        updateDoc(fromUserRef, {
            friendRequestsSent: arrayUnion(toUserId)
        }),
        updateDoc(toUserRef, {
            friendRequestsReceived: arrayUnion(fromUserId)
        })
    ]);
}

/**
 * Accepts a friend request.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The user accepting the request.
 * @param otherUserId - The user who sent the request.
 */
export async function acceptFriendRequest(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<void> {
    const currentUserRef = doc(firestore, 'users', currentUserId);
    const otherUserRef = doc(firestore, 'users', otherUserId);

    await Promise.all([
        // Add each other to friends list
        updateDoc(currentUserRef, {
            friends: arrayUnion(otherUserId),
            friendRequestsReceived: arrayRemove(otherUserId) // Remove from received requests
        }),
        updateDoc(otherUserRef, {
            friends: arrayUnion(currentUserId),
            friendRequestsSent: arrayRemove(currentUserId) // Remove from sent requests
        })
    ]);
}

/**
 * Declines or cancels a friend request.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The user declining/canceling the request.
 * @param otherUserId - The other user involved in the request.
 */
export async function declineFriendRequest(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<void> {
    const currentUserRef = doc(firestore, 'users', currentUserId);
    const otherUserRef = doc(firestore, 'users', otherUserId);

    await Promise.all([
        // Remove from current user's received requests
        updateDoc(currentUserRef, {
            friendRequestsReceived: arrayRemove(otherUserId)
        }),
        // Remove from other user's sent requests
        updateDoc(otherUserRef, {
            friendRequestsSent: arrayRemove(currentUserId)
        })
    ]);
}
