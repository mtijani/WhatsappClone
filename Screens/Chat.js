import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import firebase from '../Config/index';
import { StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/Ionicons'; 
import { Audio } from 'expo-av';



const Chat = ({ route }) => {
  const { contact } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const currentUser = firebase.auth().currentUser;
  const [recording, setRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const generateChatRoomId = (email1, email2) => {
    const sortedEmails = [email1.toLowerCase(), email2.toLowerCase()].sort();
    return sortedEmails.join('_');
  };
  const requestAudioPermission = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted;
    } catch (err) {
      console.error('Error requesting audio permission:', err);
      return false;
    }
  };

  
  const startRecording = async () => {
    try {
      const audioPermissionGranted = await requestAudioPermission();
      if (!audioPermissionGranted) {
        console.error('Audio recording permission not granted.');
        return;
      }
  
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecordingAndSend = async () => {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
  
        // Check if recording.uri is defined before sending the message
        if (recording.getURI()) {
          await sendVoiceMessage();
        } else {
          console.error('Recording URI is undefined. Unable to send the voice message.');
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
      } finally {
        setRecording(null);
      }
    }
  };
  
 
  const sendVoiceMessage = async () => {
    if (currentUser && contact && recording) {
      const chatRoomId = generateChatRoomId(currentUser.email.replace(".", ","), contact.email.replace(".", ","));
      const chatRef = firebase.database().ref(`chats/${chatRoomId}`);
      const newMessageRef = chatRef.push();
  
      const senderPhoto = currentUser.photoURL || 'DEFAULT_PHOTO_URL';
      const receiverPhoto = contact.ProfileImage || 'DEFAULT_RECEIVER_PHOTO_URL';
  
      const timestamp = new Date().getTime();
  
      try {
        // Make sure to get the URI using recording.getURI() before setting it
        const audioUri = recording.getURI();
        if (audioUri) {
          newMessageRef.set({
            audioUri,
            timestamp,
            senderId: currentUser.email || 'DEFAULT_SENDER_ID',
            senderName: currentUser.displayName || 'You',
            senderPhoto,
            receiverId: contact.email || 'DEFAULT_RECEIVER_ID',
            receiverName: `${contact.Name || 'Receiver'} ${contact.Surname || ''}`,
            receiverPhoto,
            chatRoomId,
            messageType: 'audio',
          });
  
          chatRef.update({ typing: null });
          setRecording(null);
        } else {
          console.error('Recording URI is undefined. Unable to send the voice message.');
        }
      } catch (error) {
        console.error('Error sending voice message:', error);
      }
    }
  };
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording(); // Stop recording and unload when the component unmounts
      }
    };
  }, []);
  

  useEffect(() => {
    if (!currentUser) {
      console.error('User not authenticated.');
      return;
    }

    const chatRoomId = generateChatRoomId(currentUser.email.replace(".", ","), contact.email.replace(".", ","));
    const chatRef = firebase.database().ref(`chats/${chatRoomId}`);

    const onMessageUpdate = (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageArray = Object.values(data);
        setMessages(messageArray);
      }
    };

    const onTypingUpdate = (snapshot) => {
      const data = snapshot.val();
      if (data && data.typing !== null) {
        setIsTyping(data.typing === currentUser.email);
      }
    };

    chatRef.on('value', onMessageUpdate);
    chatRef.on('value', onTypingUpdate);

    return () => {
      chatRef.off('value', onMessageUpdate);
      chatRef.off('value', onTypingUpdate);
    };
  }, [currentUser, contact.email]);

  const sendMessage = async () => {
    if (currentUser && contact) {
      const chatRoomId = generateChatRoomId(currentUser.email.replace(".", ","), contact.email.replace(".", ","));
      const chatRef = firebase.database().ref(`chats/${chatRoomId}`);
      const newMessageRef = chatRef.push();

      const senderPhoto = currentUser.photoURL || 'DEFAULT_PHOTO_URL';
      const receiverPhoto = contact.ProfileImage || 'DEFAULT_RECEIVER_PHOTO_URL';

      const timestamp = new Date().getTime();

      if (newMessage.trim() !== '' || selectedImage || selectedDocument) {
        newMessageRef.set({
          text: newMessage.trim() !== '' ? newMessage : selectedImage || selectedDocument,
          timestamp,
          senderId: currentUser.email || 'DEFAULT_SENDER_ID',
          senderName: currentUser.displayName || 'You',
          senderPhoto,
          receiverId: contact.email || 'DEFAULT_RECEIVER_ID',
          receiverName: `${contact.Name || 'Receiver'} ${contact.Surname || ''}`,
          receiverPhoto,
          chatRoomId,
          messageType: selectedImage ? 'image' : selectedDocument ? 'document' : 'text',
        });
      }

      chatRef.update({ typing: null });
      setNewMessage('');
      setSelectedImage(null);
      setSelectedDocument(null);
    }
  };

  const updateTypingStatus = (text) => {
    const chatRoomId = generateChatRoomId(currentUser.email.replace(".", ","), contact.email.replace(".", ","));
    const chatRef = firebase.database().ref(`chats/${chatRoomId}`);
  
    // Only update the typing status if the text length is greater than 0
    chatRef.update({ typing: text.length > 0 ? currentUser.email : null });
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync();

    if (result.type === 'success') {
      setSelectedDocument(result.uri);
    }
  };

  const uploadToFirebase = async (uri, messageType, fileName) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const chatRoomId = generateChatRoomId(currentUser.email.replace(".", ","), contact.email.replace(".", ","));
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(`${chatRoomId}/${messageType}s/${fileName}`);

    await fileRef.put(blob);

    const downloadURL = await fileRef.getDownloadURL();

    const chatRef = firebase.database().ref(`chats/${chatRoomId}`);
    const newMessageRef = chatRef.push();

    const senderPhoto = currentUser.photoURL || 'DEFAULT_PHOTO_URL';
    const receiverPhoto = contact.ProfileImage || 'DEFAULT_RECEIVER_PHOTO_URL';

    const timestamp = new Date().getTime();

    newMessageRef.set({
      text: downloadURL,
      timestamp,
      senderId: currentUser.email || 'DEFAULT_SENDER_ID',
      senderName: currentUser.displayName || 'You',
      senderPhoto,
      receiverId: contact.email || 'DEFAULT_RECEIVER_ID',
      receiverName: `${contact.Name || 'Receiver'} ${contact.Surname || ''}`,
      receiverPhoto,
      chatRoomId,
      messageType,
    });

    chatRef.update({ typing: null });
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.email;
    const hasValidMessage = (item.text || item.audioUri || item.imageUri || item.documentUri) && item.timestamp;
  
    const timestamp = hasValidMessage ? new Date(item.timestamp).toLocaleTimeString() : '';
  
    return (
      <View style={{ flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start', marginVertical: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {!isCurrentUser && (
            <Image
              source={{ uri: item.receiverPhoto || 'DEFAULT_RECEIVER_PHOTO_URL' }}
              style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
            />
          )}
          {hasValidMessage && (
            <>
              {item.messageType === 'audio' ? (
                <TouchableOpacity onPress={() => playAudio(item.audioUri)}>
                  <Text style={{ color: 'blue' }}>Play Audio</Text>
                </TouchableOpacity>
              ) : item.messageType === 'image' ? (
                <Image
                  source={{ uri: item.text }}
                  style={{ width: 150, height: 150, borderRadius: 8, marginTop: 5 }}
                />
              ) : item.messageType === 'document' ? (
                <TouchableOpacity onPress={() => openDocument(item.text)}>
                  <Text style={{ color: 'blue' }}>Document</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ backgroundColor: isCurrentUser ? '#DCF8C5' : '#E0E0E0', padding: 10, borderRadius: 8, maxWidth: '80%' }}>
                  <Text style={{ fontSize: 14, color: '#000' }}>{item.text}</Text>
                </View>
              )}
              <Text style={{ fontSize: 10, color: '#777', marginLeft: 5 }}>{timestamp}</Text>
            </>
          )}
          {!isCurrentUser && (
            <Image
              source={{ uri: item.senderPhoto || 'DEFAULT_SENDER_PHOTO_URL' }}
              style={{ width: 30, height: 30, borderRadius: 15, marginLeft: 8 }}
            />
          )}
        </View>
      </View>
    );
  };
  
const playAudio = async (audioUri) => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );
  } catch (error) {
    console.error('Error playing audio:', error);
  }
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
      return lastOnlineDate.toLocaleString();
    }
  };

  const openDocument = async (uri) => {
    try {
      const { status } = await DocumentPicker.getDocumentAsync({ uri });
      if (status === 'granted') {
        console.log('Document opened successfully');
      } else {
        console.log('Permission denied');
      }
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <View style={styles.infoContainer}>
        <Text style={styles.talkingToText}>{`You're now talking to: ${contact.Name || 'Someone'}`}</Text>
        <View style={styles.lastOnlineContainer}>
          <Text style={styles.lastOnlineLabel}>Last online:</Text>
          <Text style={styles.lastOnlineText}>{formatLastOnline(contact.lastOnline)}</Text>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => (item && item.timestamp ? new Date(item.timestamp).getTime().toString() : Math.random().toString())}
      />

      {isTyping && <Text style={styles.typingText}>{`Someone is typing...`}</Text>}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            updateTypingStatus(text);
          }}
        />
        <Icon
          name="send"
          size={20}
          color="#4CAF50"
          style={[styles.icon, styles.sendIcon]}
          onPress={sendMessage}
        />
        <Icon
          name="image"
          size={20}
          color="#2196F3"
          style={[styles.icon, styles.imageIcon]}
          onPress={pickImage}
        />
        <Icon
          name="document"
          size={20}
          color="#FF9800"
          style={[styles.icon, styles.documentIcon]}
          onPress={pickDocument}
        />
      </View>

      {recording ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity style={styles.recordButton} onPress={stopRecordingAndSend}>
            <Text style={{ color: 'white' }}>Recording... Tap to Stop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
          <Text style={{ color: 'white' }}>Start Recording</Text>
        </TouchableOpacity>
      )}
    </View>
  );


};


const styles = StyleSheet.create({
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  lastOnlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  lastOnlineLabel: {
    fontSize: 12,
    color: '#777',
    marginRight: 5,
  },
  lastOnlineText: {
    fontSize: 12,
    color: '#777',
  },
  talkingToText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  lastOnlineText: {
    fontSize: 12,
    color: '#777',
  },
  typingText: {
    fontSize: 12,
    color: '#FF1493',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  infoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  sendIcon: {
    backgroundColor: '#E8F5E9',
    borderRadius: 15,
    marginRight: 5,
  },
  imageIcon: {
    backgroundColor: '#BBDEFB',
    borderRadius: 15,
    marginHorizontal: 5,
  },
  documentIcon: {
    backgroundColor: '#FFECB3',
    borderRadius: 15,
    marginLeft: 5,
  },
  talkingToText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF1493',
    marginBottom: 5,
  },
  lastOnlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  lastOnlineLabel: {
    fontSize: 12,
    color: '#777',
    marginRight: 5,
  },
  lastOnlineText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  icon: {
    marginHorizontal: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  recordButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  playButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  sendButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#FF1493',
    borderRadius: 5,
  },
  sendButtonText: {
    color: 'white',
  },
 recordButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  playButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },

  sendButton: {
    backgroundColor: '#FF1493',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default Chat;