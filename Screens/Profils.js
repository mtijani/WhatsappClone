import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, TouchableHighlight, TouchableWithoutFeedback, Alert } from 'react-native';
import PickerSelect from 'react-native-picker-select';
import * as ImagePicker from 'expo-image-picker';
import firebase from '../Config/index';

const Profile = ({ navigation }) => {
  const database = firebase.database();
  const [currentUserData, setCurrentUserData] = useState(null);
  const [Name, setFullName] = useState("");
  const [Email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [PhoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    const getCurrentUserData = async () => {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        const currentUserId = currentUser.email.replace(".", ",");
        const refUser = database.ref(`users/${currentUserId}`);
        
        // Set the user as active when the component mounts
        await refUser.update({ active: true });

        const snapshot = await refUser.once('value');
        setCurrentUserData(snapshot.val());
      }
    };

    getCurrentUserData();
  }, []);

  const updateContact = async () => {
    if (!Name && !Email && !PhoneNumber && !selectedCountry && !profileImage) {
      Alert.alert('Error', 'No changes made.');
      return;
    }

    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    const currentUserId = currentUser.email.replace(".", ",");
    const refUser = database.ref(`users/${currentUserId}`);
    
    // Update the user's own data
    refUser.update({
      Name: Name || currentUserData.fullName,
      Email: Email || currentUserData.email,
      PhoneNumber: PhoneNumber || currentUserData.phone,
      CountryCode: selectedCountry?.code || currentUserData.CountryCode,
      ProfileImage: profileImage || currentUserData.ProfileImage,
      active: true, // Set the user as active
    });

    // Update the user's profile in other users' contacts
    const contactsRef = database.ref('users');
    const contactsSnapshot = await contactsRef.once('value');

    contactsSnapshot.forEach((userSnapshot) => {
      const userData = userSnapshot.val();
      const userContacts = userData.contacts || {};

      Object.keys(userContacts).forEach(async (contactId) => {
        const contact = userContacts[contactId];

        if (contact.PhoneNumber === currentUserData.phone) {
          // Update the profile for this contact in the other user's contacts
          const contactRef = contactsRef.child(`${userSnapshot.key}/contacts/${contactId}`);
          await contactRef.update({
            Name: Name || currentUserData.Name,
            Email: Email || currentUserData.Email,
            PhoneNumber: PhoneNumber || currentUserData.PhoneNumber,
            CountryCode: selectedCountry?.code || currentUserData.CountryCode,
            ProfileImage: profileImage || currentUserData.ProfileImage,
          });
        }
      });
    });

    // Pass the updated data to ListProfils screen
    navigation.navigate('ListProfils', {
      updatedData: {
        Name: Name || currentUserData.Name,
        Email: Email || currentUserData.Email,
        PhoneNumber: PhoneNumber || currentUserData.PhoneNumber,
        CountryCode: selectedCountry?.code || currentUserData.CountryCode,
        ProfileImage: profileImage || currentUserData.ProfileImage,
      },
    });

    Alert.alert('Success', 'Contact updated successfully!');
  };

  const selectProfileImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.uri);
    }
  };

  const handleLogout = async () => {
    try {
      const currentUser = firebase.auth().currentUser;
      const currentUserId = currentUser.email.replace(".", ",");
      const refUser = database.ref(`users/${currentUserId}`);
  
      // Set the user's last time online
      const lastOnlineTime = new Date().getTime();
      await refUser.update({ active: false, lastOnline: lastOnlineTime });
  
      await firebase.auth().signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error.message);
    }
  };
  

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <Text style={{ marginBottom: 25 }}>Profile</Text>

      <TouchableWithoutFeedback onPress={selectProfileImage}>
        <View>
          {profileImage || currentUserData?.ProfileImage ? (
            <Image source={{ uri: profileImage || currentUserData?.ProfileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.selectProfileImageText}>Select Profile Image</Text>
          )}
        </View>
      </TouchableWithoutFeedback>

      <TextInput
        style={styles.input}
        placeholder=" Name"
        onChangeText={(text) => setFullName(text)}
        value={Name || currentUserData?.fullName}
      />
      <TextInput
        style={styles.input}
        placeholder=" Email"
        onChangeText={(text) => setEmail(text)}
        value={Email || currentUserData?.email}
      />

      <PickerSelect
        style={{ inputAndroid: styles.input, inputIOS: styles.input }}
        placeholder={{ label: 'Select Country', value: null }}
        value={selectedCountry || currentUserData?.CountryCode}
        onValueChange={(value) => setSelectedCountry(value)}
        items={[
          { label: 'Tunisia', value: { code: '216', emoji: '🇹🇳' } },
          { label: 'France', value: { code: '33', emoji: '🇫🇷' } },
          { label: 'Germany', value: { code: '49', emoji: '🇩🇪' } },
          { label: 'Italy', value: { code: '39', emoji: '🇮🇹' } },
          { label: 'Spain', value: { code: '34', emoji: '🇪🇸' } },
          { label: 'Palestine', value: { code: '970', emoji: '🇵🇸' } },
          // ... other countries
        ]}
      />

      {selectedCountry && (
        <Text style={{ fontSize: 32 }}>{selectedCountry.emoji}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder=" Phone Number"
        onChangeText={(text) => setPhoneNumber(text)}
        value={PhoneNumber || currentUserData?.phone}
      />

      <TouchableHighlight style={styles.updateButton} onPress={updateContact}>
        <Text style={styles.updateText}>Update</Text>
      </TouchableHighlight>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  selectProfileImageText: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: '80%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    marginTop: 5,
  },
  updateButton: {
    width: '80%',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    backgroundColor: '#FF1493',
  },
  updateText: {
    color: 'white',
  },
  logoutButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF1493',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Profile;
