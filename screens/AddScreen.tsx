import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Image, FlatList, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "class-work-515be",
  storageBucket: "class-work-515be.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

export default function AddScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.cancelled) {
      setImageUri(result.uri);
    }
  };

  // Upload image to Firebase Storage
  const uploadImageToBucket = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `images/${Date.now()}.jpg`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  // Create or Update
  const handleSave = async () => {
    try {
      let imageUrl = '';
      if (imageUri) {
        imageUrl = await uploadImageToBucket(imageUri);
      }

      if (editingId) {
        const docRef = doc(db, 'images', editingId);
        await updateDoc(docRef, {
          title,
          description,
          ...(imageUrl && { imageUrl }),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'images'), {
          title,
          description,
          imageUrl,
          createdAt: serverTimestamp(),
        });
      }

      setTitle('');
      setDescription('');
      setImageUri('');
      fetchItems();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Read
  const fetchItems = async () => {
    const snapshot = await getDocs(collection(db, 'images'));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Delete
  const handleDelete = async (id, imageUrl) => {
    try {
      await deleteDoc(doc(db, 'images', id));
      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }
      fetchItems();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Edit
  const handleEdit = (item) => {
    setTitle(item.title);
    setDescription(item.description);
    setImageUri(item.imageUrl);
    setEditingId(item.id);
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput placeholder="Description" value={description} onChangeText={setDescription} />
      <Button title="Pick Image" onPress={pickImage} />
      {imageUri ? <Image source={{ uri: imageUri }} style={{ width: 100, height: 100 }} /> : null}
      <Button title={editingId ? "Update" : "Save"} onPress={handleSave} />

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ marginVertical: 10 }}>
            <Text>{item.title}</Text>
            <Text>{item.description}</Text>
            {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={{ width: 100, height: 100 }} />}
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => handleEdit(item)}>
                <Text style={{ marginRight: 10 }}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id, item.imageUrl)}>
                <Text>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: "#0B284A" },
  inputField: {
    borderWidth: 2,
    borderColor: "#173454",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 15,
    padding: 10,
    color: "#000",
  },
  button: {
    backgroundColor: "green",
    padding: 35,
    marginTop: 30,
    borderRadius: 10,
  },
  buttonText: { textAlign: "center", color: "white", fontWeight: "800" },
});


// import React, { useState } from 'react';
// import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Button } from '@react-navigation/elements';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase';
// // import { auth } from "../firebase"

// // Upload function
// const uploadImageToBucket = async (uri, filename) => {
//   const response = await fetch(uri);
//   const blob = await response.blob();

//   const storageRef = ref(storage, `images/${filename}`);
//   await uploadBytes(storageRef, blob);

//   const downloadURL = await getDownloadURL(storageRef);
//   return downloadURL;
// };

// export default function AddScreen() {
//   const [title, setTitle] = useState('');
//   const [image, setImage] = useState(null);

//   const handleSave = async () => {
//     if (!image) {
//       console.warn("No image selected...");
//       return;
//     }

//     try {
//       const imageUrl = await uploadImageToBucket(image, `memory-image-${Date.now()}.jpg`);
//       console.log("Image uploaded to bucket", imageUrl);

//       // TODO: Save title & imageUrl to Firestore
//     } catch (error) {
//       console.error("Upload failed", error);
//     }
//   };

//   const pickImage = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 0.7,
//     });

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.inputField}
//         placeholder="Memory Title"
//         onChangeText={setTitle}
//         value={title}
//       />

//       <Button title="Pick an image" onPress={pickImage} />

//       {image && (
//         <Image
//           source={{ uri: image }}
//           style={{ width: 200, height: 200, marginTop: 20 }}
//         />
//       )}

//       <TouchableOpacity style={styles.button} onPress={handleSave}>
//         <Text style={styles.buttonText}>Add Memory</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     padding: 20
//   },
//   inputField: {
//     borderWidth: 2,
//     borderColor: 'black',
//     marginTop: 15,
//     padding: 10
//   },
//   button: {
//     backgroundColor: "green",
//     textAlign: 'center',
//     padding: 35,
//     marginTop: 30
//   },
//   buttonText: {
//     textAlign: 'center',
//     color: 'white'
//   },
// });

// import React, { useState, useEffect } from 'react';
// import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Platform } from 'react-native';
// import * as ImagePicker from 'expo-image-picker';
// import { Button } from '@react-navigation/elements'; // If you want native Button, use 'react-native'
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from './firebase'; // Make sure this path is correct

// // 👇 Paste the function here
// const uploadImageToBucket = async (uri, filename) => {
//   const response = await fetch(uri);
//   const blob = await response.blob();

//   const storageRef = ref(storage, `images/${filename}`);
//   await uploadBytes(storageRef, blob);

//   const downloadURL = await getDownloadURL(storageRef);
//   return downloadURL;
// };

// export default function ImagePickerExample() {
// const AddScreen = () => {
//   const [title, setTitle] = useState('');
//   const [image, setImage] = useState<string | null>(null);

//   const handleSave = async () => 
//   {
//    //Upload image to bucket & then save the memory to firestore 
//    if (!image){
//     console.warn("No image selected...";
//         return;
//     )
//    }

//    const imageUrl = await uploadImageToBucket(image, `memory-image-${Date.now()}.jpg`);
//    console.log("Image uploaded to bucket", imageUrl);

//    //TODO: Save title & image
//   }

//   // function to pick an image
//   const pickImage = async () => {
//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsMultipleSelection: false,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 0.7,
//     });

//     console.log(result);

//     if (!result.canceled) {
//       setImage(result.assets[0].uri);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.inputField}
//         placeholder="Memory Title"
//         onChangeText={newText => setTitle(newText)}
//         defaultValue={title}
//       />

//       <Button title="Pick an image" onPress={pickImage} />

//       {image && (
//         <Image
//           source={{ uri: image }}
//           style={{ width: 200, height: 200, marginTop: 20 }}
//         />
//       )}

//       <TouchableOpacity style={styles.button} onPress={handleSave}>
//         <Text style={styles.buttonText}>Add Memory</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default AddScreen;

// const styles = StyleSheet.create({
//   container: {
//     padding: 20
//   },
//   inputField: {
//     borderWidth: 2,
//     borderColor: 'black',
//     marginTop: 15,
//     padding: 10
//   },
//   button: {
//     backgroundColor: "green",
//     textAlign: 'center',
//     padding: 15,
//     marginTop: 30
//   },
//   buttonText: {
//     textAlign: 'center',
//     color: 'white'
//   },
// });
