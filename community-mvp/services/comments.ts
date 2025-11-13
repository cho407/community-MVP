import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from './firebase';
import { Comment, CreateCommentPayload, UserProfile } from '../types/post';

function commentsCollection(postId: string) {
  return collection(db, 'posts', postId, 'comments');
}

function mapComment(snapshot: DocumentSnapshot): Comment {
  const data = snapshot.data() as Record<string, unknown>;
  const createdAt =
    data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;

  return {
    id: snapshot.id,
    postId: snapshot.ref.parent.parent?.id ?? '',
    content: (data.content as string) ?? '',
    authorId: (data.authorId as string) ?? '',
    authorName: (data.authorName as string) ?? '',
    authorAvatar: (data.authorAvatar as string | null | undefined) ?? null,
    createdAt,
  };
}

export async function addComment(
  postId: string,
  profile: UserProfile,
  payload: CreateCommentPayload,
) {
  await addDoc(commentsCollection(postId), {
    content: payload.content,
    authorId: profile.uid,
    authorName: profile.displayName,
    authorAvatar: profile.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(postId: string, commentId: string) {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
}

export function subscribeToComments(
  postId: string,
  callback: (comments: Comment[]) => void,
) {
  const q = query(commentsCollection(postId), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((docSnapshot) => mapComment(docSnapshot)));
  });
}

