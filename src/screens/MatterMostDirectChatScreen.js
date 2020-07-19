import React, { useState, useContext, useEffect } from 'react';

import { GiftedChat, Bubble, Send, SystemMessage, MessageText, Avatar, Actions, ActionsProps, MessageImage } from 'react-native-gifted-chat';
import { IconButton, Surface, Appbar } from 'react-native-paper';
import { ActivityIndicator, View, StyleSheet, ImageBackground, Modal, TouchableOpacity, Image, Button } from 'react-native';
// import DocumentPicker from 'react-native-document-picker';
import ImagePicker from 'react-native-image-picker';
import ImageViewer from 'react-native-image-zoom-viewer';

import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-community/async-storage';
import { AuthContext } from '../navigation/AuthProvider';
import mswipeIcon from '../assets/mswipe-short-logo-white.svg';
import RNFetchBlob from 'rn-fetch-blob';

const Blob = RNFetchBlob.polyfill.Blob;
const fs = RNFetchBlob.fs;

// This is the endpoint. 
const MCHAT_ENDPOINT_HTTPS = 'https://chat.connectandheal.com';
const MCHAT_ENDPOINT_WSS = 'wss://chat.connectandheal.com/api/v4/websocket';

// This is the user id of the Bot account with whom the end user will communicate.
// const BOTID = 'cwfg6umi6idixy7qbokgqi51xy';
// const BOTNAME = 'threecpo';

const BOTID = 'ppmt615zztno9pwf33cj6qrq8c';
const BOTNAME = 'Salveen';

const Client4 = require('mattermost-redux/client/client4').default;
let matterMostWebsocketClient = require('mattermost-redux/client/websocket_client').default;
let matterMostClient = new Client4;
matterMostClient.setEnableLogging(true);

interface Reply {
    title: string,
    value: string,
    messageId?: any
}

interface QuickReplies {
    type: 'radio' | 'checkbox',
    values: Reply[],
    keepIt?: boolean
}

export default function MatterMostDirectChatScreen({ route, navigation }) {

    const [imageUrls, setImageUrls] = useState([]);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [currentPage, setCurrentPage] = useState(0)
    const [messages, setMessages] = useState([]);
    const [directMessageChannel, setDirectMessageChannel] = useState([]);
    const [me, setMe] = useState(null);

    matterMostWebsocketClient.setEventCallback(function (event) {
        let eventType = event['event'];
        if (eventType === 'posted') {
            // console.log(event);
            if (event['broadcast']['channel_id'] == directMessageChannel.id) {
                console.log(event);

                let post = event['data']['post'];
                post = JSON.parse(post);
                let userName = event['data']['sender_name'].replace('@', '');
                let newMessages = formMessage(post, userName);
                setMessages(GiftedChat.append(messages, newMessages));
            }
        }
    });

    useEffect(() => {
        setMessages([]);

        AsyncStorage.getItem('credentials').then((credentials) => {
            if (credentials == null) {
                console.log('No credentials found in async storage, using default.');
                credentials = {
                    'username': 'harish',
                    'password': 'Harish@3214'
                }
            }
            else {
                console.log('Credentials found in async storage.');
                credentials = JSON.parse(credentials);
            }

            matterMostClient.setUrl(MCHAT_ENDPOINT_HTTPS);
            matterMostClient.login(credentials.username, credentials.password)
                .then(function (me) {
                    // console.log(`logged in as ${me.email}`);
                    setMe(me);

                    // create a direct message channel when the component loads. 
                    matterMostClient.createDirectChannel([
                        me.id,
                        BOTID
                    ]).then(function (channel) {
                        // console.log(channel);
                        setDirectMessageChannel(channel);

                        // load the messages. 
                        fetchPastMessages(0, channel, me);
                    });
                })
                .then(function () {
                    matterMostWebsocketClient.initialize('', { connectionUrl: MCHAT_ENDPOINT_WSS });
                })
                .catch(function (err) {
                    console.error(err);
                });
        });

        // Stop listening for updates whenever the component unmounts
        return () => { matterMostWebsocketClient.close(); };

    }, []);

    function renderActions(props: Readonly<ActionsProps>) {
        return (
            <Actions
                {...props}
                options={{
                    ['Send Image']: handlePickImage,
                }}
                icon={() => (
                    <Icon name={'upload'} size={28} />
                )}
                onSend={args => console.log(args)}
            />
        )
    }

    function handlePickImage() {
        // More info on all the options is below in the API Reference... just some common use cases shown here
        const options = {
            title: 'Select Image',
            customButtons: [],
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        /**
         * The first arg is the options object for customization (it can also be null or omitted for default options),
         * The second arg is the callback which sends object: response (more info in the API Reference)
         */
        ImagePicker.showImagePicker(options, (response) => {
            // console.log('Response = ', response);

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (response.customButton) {
                console.log('User tapped custom button: ', response.customButton);
            } else {
                // Upload the file to the server. 
                let fileFormData = new FormData();

                fileFormData.append("files", {
                    name: response.fileName,
                    type: response.type,
                    uri: Platform.OS === "android" ? response.uri : response.uri.replace("file://", "")
                });
                fileFormData.append("channel_id", directMessageChannel.id);
                matterMostClient.uploadFile(fileFormData)
                    .then((fileUploadResponse) => {
                        let fileInfo = fileUploadResponse['file_infos'][0];
                        let uploadedFileId = fileInfo['id'];

                        // create a post now with this newly uploaded file. 
                        matterMostClient.createPost({
                            channel_id: directMessageChannel.id,
                            file_ids: [uploadedFileId]
                        });
            
                    }, (reason) => {
                        console.log(reason);
                    });

                // const imageFile = RNFetchBlob.wrap(response.uri);
                // var uploadBlob = null;

                // Blob.build(imageFile, { type: response.type })
                //     .then((imageBlob) => {
                //         uploadBlob = imageBlob;

                //         fileFormData.append("files", imageBlob, response.fileName);
                //         fileFormData.append("channel_id", directMessageChannel.id);

                //         return matterMostClient.uploadFile(fileFormData);
                //     })
                //     .then((value) => {
                //         uploadBlob.close();
                //         console.log(value);
                //     }, (reason) => {
                //         console.log(reason);
                //     });


            }
        });
    }

    // async function handlePickDocument() {
    //     // Pick a single file
    //     try {
    //         const res = await DocumentPicker.pick({
    //             type: [DocumentPicker.types.images],
    //         });
    //         console.log(
    //             res.uri,
    //             res.type, // mime type
    //             res.name,
    //             res.size
    //         );
    //     } catch (err) {
    //         if (DocumentPicker.isCancel(err)) {
    //             // User cancelled the picker, exit any dialogs or menus and move on
    //             console.log('User cancelled');
    //         } else {
    //             throw err;
    //         }
    //     }
    // }

    function fetchPastMessages(currentPage, channel, me) {

        // after we have the direct message channel, we need to get hold of the past posts.
        // use these to populate the chat window.
        console.log('Fetching messages in direct message channel: ' + channel.id + '. Users involved user=' + me.id + ', bot=' + BOTID);
        matterMostClient.getPosts(channel.id, currentPage, 10).then(function (posts) {

            let newMessages = [];

            posts['order'].forEach((postId) => {
                if (posts['posts'].hasOwnProperty(postId)) {
                    let post = posts['posts'][postId];
                    let userName = BOTNAME;
                    if (post['user_id'] == me.id) {
                        userName = me['nickname'];
                    }
                    let t_newMessages = formMessage(post, userName);
                    t_newMessages.forEach((t_newMessage) => newMessages.push(t_newMessage));
                }
            });

            setMessages(GiftedChat.prepend(messages, newMessages));
        });
    }

    function formMessage(post, userName, isNew = true) {
        let r = [];

        let userObject = {
            _id: post['user_id'],
            name: userName
        };

        if (userName == BOTNAME) {
            userObject = {
                _id: post['user_id'],
                name: userName,
                // avatar: 'https://www.mswipe.com/assets/images/favicon/favicon-32x32.png'
            };
        }

        // see if there are options in the post props. if there are then this is to be a quick reply message. 
        if (isNew && post['props']['options']) {

            // form the values based on the options returned in the response.
            let values = [];
            post['props']['options'].forEach(option => {
                values.push({
                    title: option.title,
                    value: option.value
                })
            });

            r.push({
                _id: post['id'],
                text: post['props']['text'],
                createdAt: new Date(post['create_at']),
                quickReplies: {
                    type: 'radio',
                    keepIt: true,
                    values: values,
                },
                user: userObject
            });
        }
        else {
            // see if the post has a file which has been uploaded.
            let fileIds = post['file_ids'];
            if (fileIds) {
                fileIds.forEach((fileId) => {
                    let fileUrl = matterMostClient.getFilePreviewUrl(fileId);

                    r.push({
                        _id: fileId,
                        image: fileUrl,
                        createdAt: new Date(post['create_at']),
                        user: userObject
                    });

                })
            }

            r.push({
                _id: post['id'],
                text: post['message'],
                createdAt: new Date(post['create_at']),
                user: userObject
            });
        }

        return r;
    }

    function renderSend(props) {
        return (
            <Send {...props}>
                <View style={styles.sendingContainer}>
                    <IconButton icon='send-circle' size={32} color='#00BDFF' />
                </View>
            </Send>
        );
    }

    function renderSystemMessage(props) {
        return (
            <SystemMessage
                {...props}
                wrapperStyle={styles.systemMessageWrapper}
                textStyle={styles.systemMessageText}
            />
        );
    }

    function renderBubble(props) {
        return (
            // Step 3: return the component
            <Bubble
                {...props}
                useNativeDriver={true}
                wrapperStyle={{
                    right: {
                        // Here is the color change
                        // backgroundColor: '#6646ee'
                        backgroundColor: '#262E31',
                        borderRadius: 4
                    }
                }}
                textStyle={{
                    right: {
                        color: '#fff'
                    }
                }}
            />
        );
    }

    function openImageViewer(images) {
        // set state of showImageViewer === true
        setShowImageViewer(true);

        // set state of imageUrls === images
        setImageUrls(images);
    }

    function renderMessageImage(props) {
        const images = [{
            // Simplest usage.
            url: props.currentMessage.image,
            // You can pass props to <Image />.
            props: {}
        }];
        return (
            <TouchableOpacity onPress={() => props.imageProps.openImageViewer(images)}>
                <Image
                    source={{ uri: props.currentMessage.image }}
                    style={styles.image}
                />
            </TouchableOpacity>
        );
    }


    // function renderQuickReplies(props) {
    //     return (
    //         // Step 3: return the component
    //         <Bubble
    //             {...props}
    //             useNativeDriver={true}
    //             wrapperStyle={{
    //                 right: {
    //                     // Here is the color change
    //                     // backgroundColor: '#6646ee'
    //                     backgroundColor: '#262E31'
    //                 }
    //             }}
    //             textStyle={{
    //                 right: {
    //                     color: '#fff'
    //                 }
    //             }}
    //         />
    //     );
    // }

    function handleSend(newMessage = []) {
        newMessage.forEach(nm => {
            matterMostClient.createPost({
                channel_id: directMessageChannel.id,
                message: nm['text']
            });
        });
    }

    function handleQuickReply(quickReply = []) {
        quickReply.forEach(qr => {
            matterMostClient.createPost({
                channel_id: directMessageChannel.id,
                message: qr['value']
            }).then((post) => console.log(post));
        });
    }

    function scrollToBottomComponent() {
        return (
            <View style={styles.bottomComponentContainer}>
                <IconButton icon='chevron-double-down' size={36} color='#00BDFF' />
            </View>
        );
    }

    function renderLoading() {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size='large' color='#00BDFF' />
            </View>
        );
    }

    function onLoadEarlier() {
        // console.log('old page was: ' + currentPage);
        newCurrentPage = currentPage + 1;
        // console.log('new current page is: ' + newCurrentPage);
        setCurrentPage(newCurrentPage);

        fetchPastMessages(newCurrentPage, directMessageChannel, me);
    }

    function renderAvatar(props) {
        return (

            <Avatar
                {...props}

                containerStyle={{
                    left: {},
                    right: {}
                }}
                imageStyle={{ left: { backgroundColor: '#00BDFF' }, right: { backgroundColor: '#262E31' } }}
            />
            // <ImageBackground style={styles.avatarBackgroundImage} source={''}></ImageBackground>
        );
    }

    // function renderMessageText(props) {
    //     return (
    //         <MessageText
    //             {...props}
    //             containerStyle={{
    //                 left: { backgroundColor: 'yellow' },
    //                 right: { backgroundColor: 'purple' },
    //             }}
    //             textStyle={{
    //                 left: { color: 'red' },
    //                 right: { color: 'green' },
    //             }}
    //             linkStyle={{
    //                 left: { color: 'orange' },
    //                 right: { color: 'orange' },
    //             }}
    //             customTextStyle={{ fontSize: 24, lineHeight: 24 }}
    //         />
    //     );
    // }

    // function goBack() { console.log(navigation); navigation.goBack(); }

    // function handleSearch() { console.log('Searching'); }

    // function handleMore() { console.log('Shown more'); }

    return (
        // <View style={{flex: 1}}>
        //     <Appbar.Header>
        //         <Appbar.BackAction
        //             onPress={goBack}
        //         />
        //         <Appbar.Content
        //             title="Mswipe Support"
        //             subtitle="Merchant Chatbot"
        //         />
        //         {/* <Appbar.Action icon="magnify" onPress={handleSearch} /> */}
        //         {/* <Appbar.Action icon="dots-vertical" onPress={handleMore} /> */}
        //     </Appbar.Header>

        //     <GiftedChat
        //         messages={messages}
        //         // Modify the following
        //         onSend={handleSend}
        //         // user={{ _id: me.id }}
        //         onQuickReply={handleQuickReply}
        //         placeholder='Type your message here...'
        //         showUserAvatar
        //         alwaysShowSend
        //         scrollToBottom
        //         renderBubble={renderBubble}
        //         renderSend={renderSend}
        //         scrollToBottomComponent={scrollToBottomComponent}
        //         renderLoading={renderLoading}
        //         renderSystemMessage={renderSystemMessage}
        //         listViewProps={
        //             {
        //                 onEndReached: onLoadEarlier,
        //                 onEndReachedThreshold: 0.5,
        //             }
        //         }
        //     />
        // </View>

        <View style={{ backgroundColor: "#ECEFF0", flex: 1 }}>
            <GiftedChat
                messages={messages}
                // Modify the following
                onSend={handleSend}
                user={{
                    _id: BOTID,
                    name: BOTNAME,
                    avatar: 'https://www.mswipe.com/assets/images/favicon/favicon-32x32.png'
                }}
                onQuickReply={handleQuickReply}
                // renderMessageText={renderMessageText}
                renderAvatar={renderAvatar}
                placeholder='Type your message here...'
                showUserAvatar
                alwaysShowSend
                scrollToBottom
                renderBubble={renderBubble}
                quickReplyStyle={styles.quickReplyStyle}
                renderMessageImage={renderMessageImage}
                imageProps={{ openImageViewer: openImageViewer }}
                // renderQuickReplies={renderQuickReplies}
                renderSend={renderSend}
                scrollToBottomComponent={scrollToBottomComponent}
                renderLoading={renderLoading}
                renderSystemMessage={renderSystemMessage}
                renderActions={renderActions}
                listViewProps={
                    {
                        onEndReached: onLoadEarlier,
                        onEndReachedThreshold: 0.5,
                    }
                }
            />

            <Modal
                visible={showImageViewer}
                transparent={true}
                onRequestClose={() => setShowImageViewer(false)}
            >
                <ImageViewer
                    imageUrls={imageUrls}
                    enableSwipeDown={true}
                    onCancel={() => setShowImageViewer(false)}
                    useNativeDriver={true}
                    renderHeader={(currentIndex) => { return (<View><Button title="close" onPress={() => setShowImageViewer(false)}></Button></View>) }}
                />
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        width: 150,
        height: 100,
        borderRadius: 13,
        margin: 3,
        resizeMode: 'cover',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sendingContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    bottomComponentContainer: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    systemMessageWrapper: {
        backgroundColor: '#6646ee',
        borderRadius: 4,
        padding: 5
    },
    systemMessageText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold'
    },
    quickReplyStyle: {
        backgroundColor: '#ECEFF0',
        borderRadius: 4
    },
    avatarBackgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: "center",
        alignItems: "center",
        opacity: 0.7
    }
});