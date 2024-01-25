import React, { useState, useEffect } from 'react';
import { View, Text, FlatList,StyleSheet, TextInput, TouchableOpacity, Image,Alert } from 'react-native';
import firebase from '../Config/index';
import Icon from 'react-native-vector-icons/Ionicons';


const ChatScreen = ({ route }) => {
  const { chatId, groupId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const currentUser = firebase.auth().currentUser;
  const database = firebase.database();

  useEffect(() => {
    if (!currentUser) {
      console.error('User not authenticated.');
      return;
    }

    const chatRoomId = chatId || (groupId ? `groups/${groupId}` : null);

    if (!chatRoomId) {
      console.error('Invalid chat ID.');
      return;
    }

    const chatRef = firebase.database().ref(chatRoomId);

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
  }, [currentUser, chatId, groupId]);

  const sendMessage = () => {
    if (newMessage.trim() !== '' && currentUser && (chatId || groupId)) {
      const chatRoomId = chatId || (groupId ? `groups/${groupId}` : null);
      const chatRef = firebase.database().ref(chatRoomId);
      const newMessageRef = chatRef.push();

      const timestamp = new Date().getTime();
      const senderName = currentUser.email.split('@')[0]; // Extract the part before the "@"


      newMessageRef.set({
        text: newMessage,
        timestamp: timestamp,
        senderId: currentUser.email || 'DEFAULT_SENDER_ID',
        senderName:  currentUser.email.split('@')[0] 
      });

      chatRef.update({ typing: null });
      setNewMessage('');
    }
  };

  const updateTypingStatus = (text) => {
    const chatRoomId = chatId || (groupId ? `groups/${groupId}` : null);
    const chatRef = firebase.database().ref(chatRoomId);
    chatRef.update({ typing: text.length > 0 ? currentUser.email : null });
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.email;
    const senderName = isCurrentUser ? 'You' : item.senderName; // Display 'You' for the current user
    const messageStyle = isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage;
  
    // Check if the message has text and a valid timestamp
    const hasValidMessage = item.text && item.timestamp;
  
    // Format the timestamp to readable time format if it's valid
    const timestamp = hasValidMessage ? new Date(item.timestamp).toLocaleTimeString() : '';
  
    return (
      <View style={{ flexDirection: 'column', alignItems: isCurrentUser ? 'flex-end' : 'flex-start', marginVertical: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          {hasValidMessage && (
            <Text style={[{ fontSize: 14, color: '#000' }, messageStyle]}>
              {senderName ? `${senderName}: ${item.text}` : item.text}
            </Text>
          )}
          {hasValidMessage && (
            <Text style={{ fontSize: 12, color: '#777', marginLeft: 5 }}>{timestamp}</Text>
          )}
          {isCurrentUser && (
            <Icon
              name="checkmark-circle-outline" // Change the icon name according to Ionicons
              size={16}
              color={item.read ? 'blue' : '#777'} // Customize the color based on whether the message is read
              style={{ marginLeft: 5 }}
            />
          )}
        </View>
      </View>
    );
  };
  
  

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => (item && item.timestamp ? item.timestamp.toString() : Math.random().toString())}
      />

      {isTyping && <Text style={{ fontSize: 12, color: '#777' }}>{`Someone is typing...`}</Text>}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          style={{ flex: 1, height: 40, borderWidth: 1, paddingHorizontal: 10 }}
          placeholder="Type a message"
          value={newMessage}
          onChangeText={(text) => {
            setNewMessage(text);
            updateTypingStatus(text);
          }}
        />
        <TouchableOpacity
          style={{ marginLeft: 10, padding: 10, backgroundColor: '#FF1493', borderRadius: 5 }}
          onPress={sendMessage}
        >
          <Text style={{ color: 'white' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  currentUserMessage: {
    backgroundColor: '#DCF8C6', // Set background color for messages sent by the current user
    padding: 8,
    borderRadius: 10,
  },
  otherUserMessage: {
    backgroundColor: '#ECE5DD', // Set background color for messages received by other users
    padding: 8,
    borderRadius: 10,
  },
  // Add other styles as needed
});

export default ChatScreen;
