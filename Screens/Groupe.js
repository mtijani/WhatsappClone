import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import firebase from '../Config/index';
import Icon from 'react-native-vector-icons/Ionicons';

const Group = ({ navigation }) => {
  const database = firebase.database();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const refUsers = database.ref('users');
    const refGroups = database.ref('groups');

    const onDataUsers = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data).map(([id, user]) => ({ ...user, id }));
        setContacts(usersArray);
      }
    };

    const onDataGroups = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const groupsArray = Object.entries(data).map(([id, group]) => ({ ...group, id }));
        setGroups(groupsArray);
      }
    };

    refUsers.on('value', onDataUsers);
    refGroups.on('value', onDataGroups);

    return () => {
      refUsers.off('value', onDataUsers);
      refGroups.off('value', onDataGroups);
    };
  }, []);

  const renderContactItem = ({ item }) => {
    if (item.id === firebase.auth().currentUser.email.replace(".", ",")) {
      return null;
    }

    const isSelected = selectedContacts.some((contact) => contact.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.contactItem, { backgroundColor: isSelected ? '#e0f7fa' : 'white' }]}
        onPress={() => toggleSelection(item)}
      >
        <View style={styles.profileColumn}>
          {item.ProfileImage ? (
            <Image source={{ uri: item.ProfileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.defaultProfileImage} />
          )}
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.contactName}>{(item.Name || '') + ' ' + (item.Surname || '')}</Text>
          <Text style={styles.contactNumber}>{item.PhoneNumber}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupItem = ({ item }) => {
    const isParticipant = item.participants && item.participants[firebase.auth().currentUser.email.replace(".", ",")];

    const leaveGroup = () => {
      Alert.alert(
        `Leave ${item.groupName}`,
        'Are you sure you want to leave this group?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            onPress: () => {
              const currentUserEmail = firebase.auth().currentUser.email.replace(".", ",");
              const newParticipants = { ...item.participants };
              delete newParticipants[currentUserEmail];

              const updatedGroup = {
                ...item,
                participants: newParticipants,
              };

              database.ref(`groups/${item.id}`).set(updatedGroup);
            },
          },
        ],
        { cancelable: false }
      );
    };

    const viewParticipants = () => {
      const participants = item.participants ? Object.keys(item.participants) : [];
      const participantNames = participants.join(', ');

      Alert.alert(
        'Group Participants',
        `Participants: ${participantNames}`,
        [
          { text: 'OK', onPress: () => console.log('OK Pressed') },
        ],
        { cancelable: false }
      );
    };

    if (isParticipant) {
      return (
        <View style={styles.groupItemContainer}>
          <TouchableOpacity style={styles.groupItem} onPress={() => handleGroupPress(item)}>
            <Text style={styles.groupName}>{item.groupName}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={leaveGroup}>
            <Icon name="exit-outline" size={25} color="red" />
          </TouchableOpacity>
          <TouchableOpacity onPress={viewParticipants}>
            <Icon name="people-outline" size={25} color="blue" />
          </TouchableOpacity>
        </View>
      );
    } else {
      return null;
    }
  };

  const toggleSelection = (contact) => {
    const index = selectedContacts.findIndex((c) => c.id === contact.id);

    if (index === -1) {
      setSelectedContacts([...selectedContacts, contact]);
    } else {
      const newSelectedContacts = [...selectedContacts];
      newSelectedContacts.splice(index, 1);
      setSelectedContacts(newSelectedContacts);
    }
  };

  const handleCreateGroupChat = () => {
    if (selectedContacts.length < 2) {
      alert('Please select at least two contacts to create a group chat.');
      return;
    }

    if (groupName.trim() === '') {
      alert('Please enter a group name');
      return;
    }

    const currentUserEmail = firebase.auth().currentUser.email.replace(".", ",");
    const participants = selectedContacts.reduce((acc, contact) => {
      acc[contact.id] = true;
      return acc;
    }, { [currentUserEmail]: true });

    const newGroup = {
      groupName,
      participants,
    };

    const groupRef = database.ref('groups').push();
    groupRef.set(newGroup);

    setGroupName('');
    setSelectedContacts([]);
  };

  const handleGroupPress = (group) => {
    navigation.navigate('ChatScreen', { groupId: group.id });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Contacts</Text>
      <FlatList
        data={contacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
      />

      <Text style={styles.headerText}>Groups</Text>
      <FlatList
        data={groups}
        renderItem={renderGroupItem}
        keyExtractor={(item) => item.id}
      />

      <TextInput
        style={styles.groupNameInput}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
      />

      <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroupChat}>
        <Text style={styles.createGroupButtonText}>Create Group Chat</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    padding: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
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
  profileColumn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoColumn: {
    marginLeft: 16,
    flex: 1,
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
  groupNameInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  createGroupButton: {
    width: '80%',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#FF1493',
    alignSelf: 'center',
  },
  createGroupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupItem: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 5,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveChatButton: {
    backgroundColor: 'red',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 5,
  },
  leaveChatButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Group;
