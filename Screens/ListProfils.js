import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Linking, Image, TextInput } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import debounce from 'lodash/debounce';
import firebase from '../Config/index';

const ListProfils = ({ navigation }) => {
  const database = firebase.database();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = firebase.auth().currentUser;

  useEffect(() => {
    const refUsers = database.ref('users');

    const onData = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data)
          .filter(([email]) => email !== currentUser.email)
          .map(([id, user]) => ({ ...user, id }));

        setContacts(usersArray);
        setFilteredContacts(usersArray);
      }
    };

    refUsers.on('value', onData);

    return () => refUsers.off('value', onData);
  }, [currentUser.email]);

  const renderContactItem = ({ item }) => {
    if (item.id === currentUser.email.replace(".", ",")) {
      return null;
    }
  
    const isActive = item.active || false;
    const lastOnlineText = isActive
      ? 'Active now'
      : formatLastOnline(item.lastOnline);
  
    return (
      <View style={styles.contactItem}>
        {item.ProfileImage ? (
          <Image source={{ uri: item.ProfileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.defaultProfileImage} />
        )}
  
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{(item.Name || '') + ' ' + (item.Surname || '')}</Text>
          <Text style={styles.contactNumber}>{item.PhoneNumber}</Text>
          <Text style={styles.lastOnlineText}>{lastOnlineText}</Text>
        </View>
  
        <View style={styles.contactActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePhoneCall(item.PhoneNumber)}>
            <Icon name="call-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
  
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleChat(item)}>
            <Icon name="mail-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  

  const handlePhoneCall = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleMessage = (phoneNumber) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const handleChat = (contact) => {
    navigation.navigate('Chat', { contact });
  };

  const formatLastOnline = (timestamp) => {
    if (!timestamp) {
      return 'Unknown';
    }

    const lastOnlineDate = new Date(timestamp);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastOnlineDate) / (1000 * 60));

    if (minutesAgo < 1) {
      return 'Just now';
    } else if (minutesAgo < 60) {
      return `${minutesAgo} ${minutesAgo === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return lastOnlineDate.toLocaleString(); // Customize the formatting as needed
    }
  };

  const debouncedSearch = debounce((term) => {
    const lowercaseTerm = term.toLowerCase();
    const filtered = contacts.filter(
      (contact) =>
        (contact.Name && contact.Name.toLowerCase().includes(lowercaseTerm)) ||
        (contact.Surname && contact.Surname.toLowerCase().includes(lowercaseTerm)) ||
        (contact.PhoneNumber && contact.PhoneNumber.includes(term))
    );
    setFilteredContacts(filtered);
  }, 300);

  const handleSearch = (text) => {
    setSearchTerm(text);
    debouncedSearch(text);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredContacts(contacts);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          onChangeText={handleSearch}
          value={searchTerm}
        />
        {searchTerm !== '' && (
          <TouchableOpacity onPress={clearSearch}>
            <Icon name="close-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactNumber: {
    fontSize: 14,
    color: '#666666',
  },
  lastOnlineText: {
    fontSize: 12,
    color: '#777',
  },
  contactActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
    padding: 8,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#CCCCCC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    marginRight: 10,
  },
});

export default ListProfils;
