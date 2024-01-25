import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Auth from './Screens/Auth';
import Signup from './Screens/Inscription';
import Home from './Screens/Home';
import Chat from './Screens/Chat';
import GroupChat from './Screens/GroupChat';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{headerShown:false}}>
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="ChatScreen" component={GroupChat} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
