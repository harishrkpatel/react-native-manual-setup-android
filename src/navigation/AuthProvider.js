import React, { createContext, useState } from 'react';
import AsyncStorage from '@react-native-community/async-storage';

// This is the endpoint. 
const MCHAT_ENDPOINT_HTTPS = 'https://chat.connectandheal.com';
const MCHAT_ENDPOINT_WSS = 'wss://chat.connectandheal.com/api/v4/websocket';

const Client4 = require('mattermost-redux/client/client4').default;
let matterMostWebsocketClient = require('mattermost-redux/client/websocket_client').default;
let matterMostClient = new Client4;

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    return (
        <AuthContext.Provider
            value={{
                login: async (email, password, loginSuccess, loginFailure) => {
                    try {
                        // await auth().signInWithEmailAndPassword(email, password);
                        console.log('Login called');

                        matterMostClient.setUrl(MCHAT_ENDPOINT_HTTPS);
                        matterMostClient.login(email, password)
                            .then(async (me) => {
                                console.log(`Logged in as: ${me}`);
                                await AsyncStorage.setItem('me', JSON.stringify(me));
                                await AsyncStorage.setItem('credentials', JSON.stringify({ 'username': email, 'password': password }));

                                loginSuccess(me);
                            })
                            .catch(function (err) {
                                console.error(err);

                                loginFailure(err);
                            });

                    } catch (e) {
                        console.log(e);
                    }
                },

                // register: async (email, password) => {
                //     try {
                //         await auth().createUserWithEmailAndPassword(email, password);
                //     } catch (e) {
                //         console.log(e);
                //     }
                // },
                // logout: async () => {
                //     try {
                //         // await auth().signOut();
                //     } catch (e) {
                //         console.error(e);
                //     }
                // }
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
