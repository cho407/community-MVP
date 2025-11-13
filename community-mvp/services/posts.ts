import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { db, storage } from './firebase';
import { CreatePostPayload, Post, UpdatePostPayload, UserProfile } from '../types/post';

const postsCollection = collection(db, 'posts');

function mapPost(docSnapshot: DocumentSnapshot): Post {
  const data = docSnapshot.data() as Record<string, unknown>;

  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null;
  const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : null;

  return {
    id: docSnapshot.id,
    title: (data.title as string) ?? '',
    content: (data.content as string) ?? '',
    imageUrl: (data.imageUrl as string | undefined | null) ?? null,
    authorId: (data.authorId as string) ?? '',
    authorName: (data.authorName as string) ?? '',
    authorAvatar: (data.authorAvatar as string | undefined | null) ?? null,
    createdAt,
    updatedAt,
  };
}

async function uploadImageAsync(uri: string, uid: string): Promise<string> {
  const imageId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
  const storageRef = ref(storage, `posts/${uid}/${imageId}`);

  const response = await fetch(uri);
  const blob = await response.blob();

  await uploadBytes(storageRef, blob, {
    contentType: blob.type ?? 'image/jpeg',
  });

  return getDownloadURL(storageRef);
}

export async function createPost(profile: UserProfile, payload: CreatePostPayload): Promise<string> {
  let imageUrl: string | null | undefined = null;

  if (payload.imageUri) {
    imageUrl = await uploadImageAsync(payload.imageUri, profile.uid);
  }

  const docRef = await addDoc(postsCollection, {
    title: payload.title,
    content: payload.content,
    imageUrl: imageUrl ?? null,
    authorId: profile.uid,
    authorName: profile.displayName,
    authorAvatar: profile.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updatePost(
  postId: string,
  profile: UserProfile,
  payload: UpdatePostPayload,
): Promise<void> {
  const docRef = doc(db, 'posts', postId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('게시글을 찾을 수 없습니다.');
  }

  const data = snapshot.data();
  const currentImageUrl = (data?.imageUrl as string | null | undefined) ?? null;
  let nextImageUrl: string | null | undefined = currentImageUrl;

  if (payload.removeImage) {
    if (currentImageUrl) {
      try {
        const url = new URL(currentImageUrl);
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\//, '').split('/o/')[1] ?? '');
        if (path) {
          await deleteObject(ref(storage, path));
        }
      } catch {
        // noop
      }
    }
    nextImageUrl = null;
  } else if (payload.imageUri && payload.imageUri !== currentImageUrl) {
    nextImageUrl = await uploadImageAsync(payload.imageUri, profile.uid);
  }

  await updateDoc(docRef, {
    ...(payload.title !== undefined ? { title: payload.title } : null),
    ...(payload.content !== undefined ? { content: payload.content } : null),
    imageUrl: nextImageUrl ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePost(postId: string): Promise<void> {
  const docRef = doc(db, 'posts', postId);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    const data = snapshot.data();
    const imageUrl = (data?.imageUrl as string | null | undefined) ?? null;

    if (imageUrl) {
      try {
        const url = new URL(imageUrl);
        const path = decodeURIComponent(url.pathname.replace(/^\/v0\/b\//, '').split('/o/')[1] ?? '');
        if (path) {
          await deleteObject(ref(storage, path));
        }
      } catch {
        // noop
      }
    }
  }

  await deleteDoc(docRef);
}

export async function fetchPostById(postId: string): Promise<Post | null> {
  const snapshot = await getDoc(doc(db, 'posts', postId));

  if (!snapshot.exists()) {
    return null;
  }

  return mapPost(snapshot);
}

export async function fetchPosts(limitCount = 50): Promise<Post[]> {
  const snapshot = await getDocs(
    query(postsCollection, orderBy('createdAt', 'desc'), limit(limitCount)),
  );

  return snapshot.docs.map((docSnapshot) => mapPost(docSnapshot));
}

export async function fetchPostsByAuthor(authorId: string, limitCount = 50): Promise<Post[]> {
  const snapshot = await getDocs(query(postsCollection, where('authorId', '==', authorId)));
  return snapshot.docs
    .map((docSnapshot) => mapPost(docSnapshot))
    .sort((a, b) => {
      const aTime = a.createdAt ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, limitCount);
}

export function subscribeToMyPosts(
  uid: string,
  callback: (posts: Post[]) => void,
  limitCount = 50,
) {
  const q = query(postsCollection, where('authorId', '==', uid));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs
      .map((docSnapshot) => mapPost(docSnapshot))
      .sort((a, b) => {
        const aTime = a.createdAt ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);
    callback(posts);
  });
}

export function subscribeToPosts(callback: (posts: Post[]) => void, limitCount = 50) {
  const q = query(postsCollection, orderBy('createdAt', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((docSnapshot) => mapPost(docSnapshot));
    callback(posts);
  });
}

