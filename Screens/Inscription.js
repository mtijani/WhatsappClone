import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import firebase from '../Config/index';

const Signup = ({ navigation }) => {
  const auth = firebase.auth();
  const database = firebase.database();

  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // New state for phone number
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    if (password === confirmPassword) {
      auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          // Signed in
          var user = userCredential.user;
  
          // Store additional user information in the database
          const userId = user.email.replace('.', ',');
          const userRef = database.ref(`users/${userId}`);
  
          userRef.set({
            fullName: fullName,
            email: email,
            phone: phoneNumber, // Store phone number in the database
          });
  
          navigation.replace("Auth");
        })
        .catch((error) => {
          var errorCode = error.code;
          var errorMessage = error.message;
          // Handle errors...
        });
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Signup Page</Text>

      <View style={styles.inputView}>
        <TextInput
          style={styles.TextInput}
          placeholder="Full Name"
          placeholderTextColor="#003f5c"
          onChangeText={(text) => setFullName(text)}
        />
      </View>

      <View style={styles.inputView}>
        <TextInput
          style={styles.TextInput}
          placeholder="Email"
          placeholderTextColor="#003f5c"
          onChangeText={(text) => setEmail(text)}
        />
      </View>

      <View style={styles.inputView}>
        <TextInput
          style={styles.TextInput}
          placeholder="Phone Number"
          placeholderTextColor="#003f5c"
          onChangeText={(text) => setPhoneNumber(text)}
        />
      </View>

      <View style={styles.inputView}>
        <TextInput
          style={styles.TextInput}
          placeholder="Password"
          placeholderTextColor="#003f5c"
          secureTextEntry={true}
          onChangeText={(text) => setPassword(text)}
        />
      </View>

      <View style={styles.inputView}>
        <TextInput
          style={styles.TextInput}
          placeholder="Confirm Password"
          placeholderTextColor="#003f5c"
          secureTextEntry={true}
          onChangeText={(text) => setConfirmPassword(text)}
        />
      </View>

      <TouchableOpacity style={styles.loginBtn} onPress={handleSignup}>
        <Text style={styles.loginText}>Signup</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => navigation.navigate("Auth")}
      >
        <Text style={styles.loginText}>Go back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
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
  loginBtn: {
    width: "80%",
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    backgroundColor: "#FF1493",
  },
  loginText: {
    color: "white",
  },
};

export default Signup;
