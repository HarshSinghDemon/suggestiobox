
import { Firestore, doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore";
import type { FirebaseUser } from "./types";

/**
 * Sends a friend request from one user to another and creates a notification.
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
    
    const fromUserSnap = await getDoc(fromUserRef);
    if (!fromUserSnap.exists()) throw new Error("Could not find sender's user profile.");
    const fromUserData = fromUserSnap.data() as FirebaseUser;


    const notificationRef = collection(firestore, 'users', toUserId, 'notifications');
    
    await Promise.all([
        updateDoc(fromUserRef, {
            friendRequestsSent: arrayUnion(toUserId)
        }),
        updateDoc(toUserRef, {
            friendRequestsReceived: arrayUnion(fromUserId)
        }),
        addDoc(notificationRef, {
            recipientId: toUserId,
            senderId: fromUserId,
            senderName: fromUserData.displayName,
            senderImage: fromUserData.photoURL,
            type: 'friend_request',
            content: 'sent you a friend request.',
            relatedId: fromUserId, // Link to sender's profile or members page
            relatedLink: '/community-members',
            isRead: false,
            createdAt: serverTimestamp(),
        })
    ]);
}

/**
 * Cancels a previously sent friend request.
 * @param firestore - The Firestore instance.
 * @param fromUserId - The ID of the user canceling the request.
 * @param toUserId - The ID of the user who received the request.
 */
export async function cancelFriendRequest(firestore: Firestore, fromUserId: string, toUserId: string): Promise<void> {
    const fromUserRef = doc(firestore, 'users', fromUserId);
    const toUserRef = doc(firestore, 'users', toUserId);

    await Promise.all([
        updateDoc(fromUserRef, {
            friendRequestsSent: arrayRemove(toUserId)
        }),
        updateDoc(toUserRef, {
            friendRequestsReceived: arrayRemove(fromUserId)
        })
    ]);
}


/**
 * Accepts a friend request and sends a notification back.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The user accepting the request.
 * @param otherUserId - The user who sent the request.
 */
export async function acceptFriendRequest(firestore: Firestore, currentUserId: string, otherUserId: string): Promise<void> {
    const currentUserRef = doc(firestore, 'users', currentUserId);
    const otherUserRef = doc(firestore, 'users', otherUserId);
    
    const currentUserSnap = await getDoc(currentUserRef);
    if (!currentUserSnap.exists()) throw new Error("Could not find your user profile.");
    const currentUserData = currentUserSnap.data() as FirebaseUser;

    const notificationRef = collection(firestore, 'users', otherUserId, 'notifications');

    await Promise.all([
        // Add each other to friends list
        updateDoc(currentUserRef, {
            friends: arrayUnion(otherUserId),
            friendRequestsReceived: arrayRemove(otherUserId) // Remove from received requests
        }),
        updateDoc(otherUserRef, {
            friends: arrayUnion(currentUserId),
            friendRequestsSent: arrayRemove(currentUserId) // Remove from sent requests
        }),
        // Send notification to the original sender
        addDoc(notificationRef, {
            recipientId: otherUserId,
            senderId: currentUserId,
            senderName: currentUserData.displayName,
            senderImage: currentUserData.photoURL,
            type: 'friend_request_accepted',
            content: 'accepted your friend request!',
            relatedId: currentUserId,
            relatedLink: '/community-members',
            isRead: false,
            createdAt: serverTimestamp(),
        })
    ]);
}

/**
 * Declines a friend request.
 * @param firestore - The Firestore instance.
 * @param currentUserId - The user declining the request.
 * @param otherUserId - The user who sent the request.
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

    
