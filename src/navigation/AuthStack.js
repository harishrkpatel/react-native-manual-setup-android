import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import MatterMostDirectChatScreen from '../screens/MatterMostDirectChatScreen';

const Stack = createStackNavigator();

export default function AuthStack() {
    return (
        <Stack.Navigator initialRouteName='Login'
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
            headerMode='none'
        >

            <Stack.Screen name='Login' component={LoginScreen} />

            {/* <Stack.Screen name='Signup' component={SignupScreen} /> */}

            <Stack.Screen
                name='Room'
                component={MatterMostDirectChatScreen}
            />

        </Stack.Navigator>
    );
}
