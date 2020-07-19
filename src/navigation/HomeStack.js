import React from 'react';
import { StackActions, createStackNavigator } from '@react-navigation/stack';
import MatterMostDirectChatScreen from '../screens/MatterMostDirectChatScreen';
import { IconButton } from 'react-native-paper';

const ChatAppStack = createStackNavigator();
// const popAction = StackActions.pop({n: 1});

export default function ChatApp() {

    return (
        <ChatAppStack.Navigator
            initialRouteName='Room'
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#6646ee',
                },
                headerTintColor: '#ffffff',
                headerTitleStyle: {
                    fontSize: 22,
                },
                headerShown: false
            }}
        >

            <ChatAppStack.Screen
                name='Room'
                component={MatterMostDirectChatScreen}
            />

        </ChatAppStack.Navigator>
    );
}
