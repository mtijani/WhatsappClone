// Auth.js

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, StatusBar, Alert, BackHandler } from 'react-native';
import firebase from '../Config/index';
export default function Auth({ navigation, onLogin }) {
  const auth  = firebase.auth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword]= useState('');
  const [newUser, setNewUser] = useState('Create new User');

  const handleCancel = () => {
    Alert.alert(
      'Confirm Exit',
      'Are you sure you want to close the app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: false }
    );
  };

  const handleLogin = () => {
   
      auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
        // Signed in
        var user = userCredential.user;
        navigation.replace('Home');
        // ...
      })
       
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          // Handle errors...
        });
    
  };
  

  return (
    <ImageBackground
      source={require('../assets/2238234.jpg')}
      style={styles.backgroundImage}
    >
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Authentication</Text>

        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Email."
            placeholderTextColor="#003f5c"
            onChangeText={(email) => setEmail(email)}
          />
        </View>
        <View style={styles.inputView}>
          <TextInput
            style={styles.TextInput}
            placeholder="Password."
            placeholderTextColor="#003f5c"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
        </View>
    

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>LOGIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginBtn} onPress={handleCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            paddingRight: 1,
            width: '100%',
            alignItems: 'flex-end',
            marginTop: 10,
            marginRight: 15,
          }}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={{ fontWeight: 'bold', color: 'white' }}>{newUser}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}
const styles ={
  container: {
    flex: 1,
    backgroundColor: "rgba(255,192,203,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  inputView: {
    backgroundColor: "rgba(255,192,203,0.7)",
    borderRadius: 30,
    width: "70%",
    height: 45,
    marginBottom: 20,
    alignItems: "center",
  },
  TextInput: {
    height: 50,
    flex: 1,
    padding: 10,
    marginLeft: 20,
  },
  cancel_button: {
    height: 30,
    marginBottom: 30,
    color: "#000",
  },
  loginBtn: {
    width: "80%",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    backgroundColor: "#FF1493",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  loginText: {
    color: "white",
  },
};
