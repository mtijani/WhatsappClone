import { View, Text } from 'react-native'
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import Groupe from './Groupe'
import ListProfils from './ListProfils'
import Profils from './Profils'

import React from 'react'
const Tab = createMaterialBottomTabNavigator()
export default function Home() {
  return (
 <Tab.Navigator>
    <Tab.Screen name="Groupe" component={Groupe} />
    <Tab.Screen name="ListProfils" component={ListProfils} />
    <Tab.Screen name="Profils" component={Profils} />
    </Tab.Navigator>
  )
}