import React, { useEffect, useState } from "react";
import { View, TextInput, Button, Image, FlatList, Text, TouchableOpacity, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { storage, db } from "../firebase";

type Memory = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt?: any;
};

export default function AddScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [items, setItems] = useState<Memory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Request media library permissions (needed on iOS / newer Android)
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow photo library access to pick an image.");
      }
    })();
  }, []);

  // Back-compatible mediaTypes (works on older/newer expo-image-picker)
  const getMediaTypes = () =>
    // @ts-ignore new API
    (ImagePicker as any).MediaType?.Images ??
    // @ts-ignore old API
    (ImagePicker as any).MediaTypeOptions?.Images ??
    undefined; // omit to default to images

  const pickImage = async () => {
    const result: any = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: getMediaTypes(),
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    // Handle both new (result.canceled) and very old (result.cancelled) shapes
    const canceled = result?.canceled ?? result?.cancelled;
    if (!canceled) {
      const uri = result?.assets?.[0]?.uri ?? result?.uri;
      if (uri) setImageUri(uri);
    }
  };

  // Upload to Storage and return download URL
async function uploadImageToBucket(uri: string, filename: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();

  const storageRef = ref(storage, `images/${filename}`);
  const metadata = { contentType: blob.type || "image/jpeg" };

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, metadata);

    // 🔹 Replace this whole on() call with the debug logging version
    task.on(
      "state_changed",
      undefined,
      (err: any) => {
        console.log("UPLOAD ERROR CODE:", err?.code);
        console.log("UPLOAD ERROR MESSAGE:", err?.message);
        console.log("RAW ERROR:", err);
        reject(err);
      },
      async () => {
        const url = await getDownloadURL(storageRef);
        console.log("URL:", url);
        resolve();
      }
    );
  });

  return await getDownloadURL(storageRef);
}


  // CREATE or UPDATE
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title.");
      return;
    }

    try {
      setSaving(true);

      let imageUrl: string | undefined;
      if (imageUri) {
        const filename = `memory-image-${Date.now()}.jpg`;
        imageUrl = await uploadImageToBucket(imageUri, filename);
      }

      if (editingId) {
        // UPDATE doc (only fields provided)
        await updateDoc(doc(db, "images", editingId), {
          title: title.trim(),
          description: description.trim(),
          ...(imageUrl ? { imageUrl } : {}),
        });
        setEditingId(null);
      } else {
        // CREATE doc
        await addDoc(collection(db, "images"), {
          title: title.trim(),
          description: description.trim(),
          imageUrl: imageUrl ?? "",
          createdAt: serverTimestamp(),
        });
      }

      // reset form and refresh list
      setTitle("");
      setDescription("");
      setImageUri(null);
      fetchItems();
    } catch (err: any) {
      console.error("Save failed:", err);
      Alert.alert("Save failed", err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  // READ (list)
  const fetchItems = async () => {
    const q = query(collection(db, "images"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Memory[];
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // DELETE (doc + image in Storage)
  const handleDelete = async (id: string, imageUrl?: string) => {
    try {
      await deleteDoc(doc(db, "images", id));

      if (imageUrl) {
        // Turn download URL into a storage path: images/xxx.jpg
        // URL format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<ENCODED_PATH>?...
        const encoded = imageUrl.split("/o/")[1]?.split("?")[0];
        if (encoded) {
          const path = decodeURIComponent(encoded); // "images%2Ffile.jpg" -> "images/file.jpg"
          await deleteObject(ref(storage, path));
        }
      }

      fetchItems();
    } catch (err: any) {
      console.error("Delete failed:", err);
      Alert.alert("Delete failed", err?.message ?? String(err));
    }
  };

  // EDIT (prefill form)
  const handleEdit = (m: Memory) => {
    setTitle(m.title ?? "");
    setDescription(m.description ?? "");
    setImageUri(m.imageUrl ?? null);
    setEditingId(m.id);
  };

  return (
    <View style={{ padding: 20, flex: 1, backgroundColor: "#0B284A" }}>
      <TextInput
        placeholder="Title"
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          color: "#000",
          marginBottom: 10,
        }}
      />
      <TextInput
        placeholder="Description"
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          paddingHorizontal: 12,
          height: 44,
          color: "#000",
          marginBottom: 10,
        }}
      />

      <Button title="Pick Image" onPress={pickImage} />
      {!!imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{ width: 160, height: 120, marginTop: 12, borderRadius: 8, alignSelf: "flex-start" }}
        />
      )}

      <View style={{ height: 10 }} />
      <Button title={editingId ? (saving ? "Updating..." : "Update") : (saving ? "Saving..." : "Save")} onPress={handleSave} disabled={saving} />

      <View style={{ height: 24 }} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#102C4A", borderRadius: 10, padding: 12, marginBottom: 12 }}>
            <Text style={{ color: "#E6EEF7", fontWeight: "800" }}>{item.title}</Text>
            {!!item.description && <Text style={{ color: "#90A4B8", marginTop: 4 }}>{item.description}</Text>}
            {!!item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={{ width: 160, height: 120, borderRadius: 8, marginTop: 8 }} />
            )}
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={{ color: "#FFC530", marginRight: 16 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.imageUrl)}>
                <Text style={{ color: "#FF7A2F" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

