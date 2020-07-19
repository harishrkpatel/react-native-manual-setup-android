import React, { useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import { NavigationContainer } from '@react-navigation/native';

import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import { AuthContext } from './AuthProvider';
import Loading from '../components/Loading';

export default function Routes() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        console.log("Routes.useEffect called...");
        AsyncStorage.getItem('me').then((user) => {
            setUser(JSON.parse(user));
            setLoading(false);    
        });
    }, []);

    if (loading) {
        return <Loading />;
    }

    return (
        // Use this for login based.
        // <NavigationContainer>
        //     {user ? <HomeStack /> : <AuthStack />}
        // </NavigationContainer>

        // Use this for direct to chat screen. In which case the credentials are assumed to be hard-coded.
        <NavigationContainer>
            <HomeStack />
        </NavigationContainer>

    );
}
