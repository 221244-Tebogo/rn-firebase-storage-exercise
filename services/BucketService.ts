// TODO: Upload Image to Buckets

import { getDownloadURL, uploadBytes } from "firebase/storage";

export const uoloadImageToBucket = async (
  imageUri: string,
  imageName: string
) => {
  //create storage ref
  //this is where we will upload our image
  const storageRef = ref(storage, `images/${imageName}`);

  //convert the image to a blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {};

    xhr.onerror = () => {};
    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true); //open image URI location
    xhr.send(null);
  });

  //upload to our blob to storage ref
  //   const uploadResult = await uploadBytes(storageRef, blob);
  //   blob.close(); //close the blob to free up memory
  const uploadResult = await uploadBytes(storageRef, blob);

  return await getDownloadURL(storageRef); //the download URL of the uploaded image
};
