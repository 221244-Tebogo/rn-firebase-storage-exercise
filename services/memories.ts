import { db, storage } from "../firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

// CREATE
export async function createMemory(title: string, imageUri: string) {
  const filename = `memory-image-${Date.now()}.jpg`;
  const imageUrl = await uploadImage(imageUri, filename);
  await addDoc(collection(db, "memories"), {
    title,
    imageUrl,
    createdAt: serverTimestamp(),
  });
}

// READ
export async function listMemories() {
  const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// UPDATE
export async function updateMemory(id: string, newTitle: string) {
  await updateDoc(doc(db, "memories", id), { title: newTitle });
}

// DELETE
export async function deleteMemory(id: string, imageUrl: string) {
  const imagePath = decodeURIComponent(imageUrl.split("/o/")[1].split("?")[0]);
  await deleteObject(ref(storage, imagePath));
  await deleteDoc(doc(db, "memories", id));
}

// Helper
async function uploadImage(uri: string, filename: string) {
  const res = await fetch(uri);
  const blob = await res.blob();
  const storageRef = ref(storage, `images/${filename}`);
  await uploadBytesResumable(storageRef, blob);
  return await getDownloadURL(storageRef);
}
