import React, { useState, useContext } from 'react';
import { View, StyleSheet } from 'react-native';
import { Title, Dialog, Portal, Paragraph, Button } from 'react-native-paper';
import FormInput from '../components/FormInput';
import FormButton from '../components/FormButton';
import { AuthContext } from '../navigation/AuthProvider';

export default function Login({ navigation }) {
    const { login } = useContext(AuthContext);

    const [loggedIn, setLoggedIn] = useState(false);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    _loginFailure = (err) => setDialogVisible(true);

    _loginSuccess = (usr) => {
        setLoggedIn(true);
        navigation.navigate('Room');
    }

    return (
        <View style={styles.container}>
            <Title style={styles.titleText}>Mswipe ChatBot</Title>
            <FormInput
                labelName='Username'
                value={email}
                autoCapitalize='none'
                onChangeText={userEmail => setEmail(userEmail)}
            />
            <FormInput
                labelName='Password'
                value={password}
                secureTextEntry={true}
                onChangeText={userPassword => setPassword(userPassword)}
            />
            <FormButton
                title='Login'
                modeValue='contained'
                labelStyle={styles.loginButtonLabel}
                onPress={() => login(email, password, _loginSuccess, _loginFailure)}
            />
            {/* <FormButton
                title='New user? Join here'
                modeValue='text'
                uppercase={false}
                labelStyle={styles.navButtonText}
                onPress={() => navigation.navigate('Signup')}
            /> */}

            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => setDialogVisible(false)}>
                    <Dialog.Title>Alert</Dialog.Title>
                    <Dialog.Content>
                        <Paragraph>Unable to authenticate your profile. Invalid username or password.</Paragraph>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDialogVisible(false)}>Ok</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f5f5f5',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    titleText: {
        fontSize: 24,
        marginBottom: 10
    },
    loginButtonLabel: {
        fontSize: 22
    },
    navButtonText: {
        fontSize: 16
    }
});
