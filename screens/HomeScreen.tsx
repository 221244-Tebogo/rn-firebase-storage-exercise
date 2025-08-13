import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const HomeScreen = () => {

  const navigation: any = useNavigation();

  //TODO: Show all of the images that are in your memories (try do it real time listening)
  
  return (
    <ScrollView style={styles.container}>
        <Pressable onPress={() => navigation.navigate("Add")}>
            <MaterialIcons name="add-photo-alternate" size={24} color="green" />
        </Pressable>
        
        {/* Card of your images that you need to loop through */}
        <View style={styles.card}>
            <Image
                style={styles.img}
                source={{
                    uri: 'https://reactnative.dev/img/tiny_logo.png',
                }} />

            <Text>Image Title</Text>
        </View>
    </ScrollView>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    card: {
        flex: 1,
        backgroundColor: 'white',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20
    },
    img: {
        width: '100%',
        height: 200,
        objectFit: 'cover'
    }
})