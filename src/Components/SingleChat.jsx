import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import { Box, Flex, FormControl, IconButton, Input, InputGroup, InputRightElement, Spinner, Text, useToast } from '@chakra-ui/react';
import { IoMdArrowRoundBack } from "react-icons/io";
import { getSender, getSenderFull } from '../Config/ChatLogics';
import ProfileModal from './miscellaneous/ProfileModal';
import UpdateGroupChatModel from './miscellaneous/UpdateGroupChatModel';
import axios from 'axios';
import "./styles.css";
import ScrollableChat from './ScrollableChat';
import io from "socket.io-client"
import Lottie from "react-lottie"
import animationData from "../Animations/Typing.json"
import { CiImageOn } from "react-icons/ci";
import { TiMicrophoneOutline } from "react-icons/ti";
import voiceAnimation from "../Animations/voice.json"
import END_POINT from '../server';


const ENDPOINT = END_POINT;
var socket, selectedChatCompare;

const SingleChat = ({fetchAgain,setFetchAgain}) => {

    const [messages, setMessages] = useState([]);
    const [loading,setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing,setTyping] = useState(false);
    const [isTyping,setIsTyping] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    const [chunks, setChunks] = useState([]);
    
    const defaultOptions = {
        loop:true,
        autoplay:true,
        animationData:animationData,
        rendererSettings:{
            preserveAspectRatio:"xMidYMid slice",
        }
    }

    const voiceOptions = {
        loop:true,
        autoplay:true,
        animationData:voiceAnimation,
        rendererSettings:{
            preserveAspectRatio:"xMidYMid slice",
        }
    }

    const toast = useToast();
    const {user,selectedChat, setSelectedChat,notifications,setNotifications} = ChatState();

    const fetchMessages = async () => {
        if(!selectedChat) return;

        try {
            const config ={
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };
            setLoading(true)

            const {data} = await axios.get(`${END_POINT}/api/message/${selectedChat._id}`,
            config
            )

            setMessages(data)
            setLoading(false)

            socket.emit('join chat',selectedChat._id);
        } catch (error) {
            toast({
                title:"Error Occured!",
                description:"Failed to send the Message",
                status:"error",
                duration:5000,
                isClosable:true,
                position:"bottom",
            })
        }
    }

    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup",user);
        socket.on('connected',() => setSocketConnected(true))
        socket.on('typing', () => setIsTyping(true))
        socket.on('stop typing', () => setIsTyping(false))
    });


    useEffect(() => {
        fetchMessages();

        selectedChatCompare = selectedChat;
    },[selectedChat]);


    useEffect(() => {
        socket.on('message received',(newMessageReceived) => {
            if(!selectedChatCompare || selectedChatCompare._id !== newMessageReceived.chat._id) 
            {
                if(!notifications.includes(newMessageReceived)){
                    setNotifications([newMessageReceived, ...notifications])
                    setFetchAgain(!fetchAgain)
                }
            }
            else{
                setMessages([...messages, newMessageReceived]);
            }
        });
    })
    
    const sendMessage = async (event) => {
        if(event.key==="Enter" && newMessage){
            socket.emit('stop typing',selectedChat._id)
            try {
                const config ={
                    headers: {
                        "Content-Type":"application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                };

                const {data} = await axios.post(`${END_POINT}/api/message`,{
                    content: newMessage,
                    chatId: selectedChat._id,
                },
                config
                );
                console.log(data);

                setNewMessage("")
                socket.emit('new message',data);
                setMessages([...messages,data])
            } catch (error) {
                toast({
                    title:"Error Occured!",
                    description:"Failed to send the Message",
                    status:"error",
                    duration:5000,
                    isClosable:true,
                    position:"bottom",
                })
            }
        }
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1]; // Extract base64 data
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'Content-Type': 'application/json',
                    },
                };
    
                const { data } = await axios.post(
                    `${END_POINT}/api/message`,
                    {
                        content: base64data, // Send base64 data instead of the file
                        chatId: selectedChat._id,
                        isImage: true, // Optionally, you can send a flag indicating it's an image
                    },
                    config
                );
    
            // Now, emit the image data to the server via socket.io
            socket.emit('new message',data);
            setMessages([...messages,data])
    
        } catch (error) {
            console.error('Error uploading image:', error);
            toast({
                title: 'Error Occurred!',
                description: 'Failed to upload the image',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
        }
    };
    reader.readAsDataURL(file); // Read file as base64
};

const handleVoiceChat = () => {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
};

const startRecording = () => {
    setIsRecording(true);
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            const audioRecorder = new MediaRecorder(stream);
            audioRecorder.ondataavailable = (e) => {
                const chunks = [];
                chunks.push(e.data);
                console.log("ch",chunks);
                setChunks([...chunks]); // Set the state with a copy of the updated array
                console.log("chu",chunks);
                console.log("Received chunk:", e.data);
            };
            audioRecorder.start();
            console.log("Recording started");
            console.log("chunks",chunks);
            setRecorder(audioRecorder);
        })
        .catch((error) => {
            console.error('Error accessing user media:', error);
            toast({
                title: 'Error Occurred!',
                description: 'Failed to access microphone',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
        });
};



const stopRecording = async () => {
    setIsRecording(false);
    if (recorder && recorder.state === "recording") {
        recorder.onstop = async () => {
            console.log("CHE",chunks);
            const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
            console.log("Created Blob:", audioBlob);

            const reader = new FileReader();
            reader.onload = () => {
                const base64data = reader.result.split(',')[1];
                console.log("Base64 Data:", base64data);
                sendAudio(base64data);
            };

            // Read from the Blob inside the FileReader onload event
            reader.readAsDataURL(audioBlob);

            // Clear chunks directly without relying on state update
            chunks.length = 0;

            setRecorder(null);
        };

        recorder.stop();
        console.log("Recording stopped");
    }
};


const sendAudio = async (base64data) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            },
        };
        console.log("audio",base64data);
        const { data } = await axios.post(
            `${END_POINT}/api/message`,
            {
                content:`blob:${base64data}`, 
                chatId: selectedChat._id,
            },
            config
        );
            console.log("data",data);
        // Now, emit the audio data to the server via socket.io
        socket.emit('new message', data);
        setMessages([...messages, data]);
    } catch (error) {
        console.error('Error uploading audio:', error);
        toast({
            title: 'Error Occurred!',
            description: 'Failed to upload the audio',
            status: 'error',
            duration: 5000,
            isClosable: true,
            position: 'bottom',
        });
    }
};



    const typingHandler =async (e) => {
        setNewMessage(e.target.value);

        if(!socketConnected) return;

        if(!typing) {
            setTyping(true)
            socket.emit('typing',selectedChat._id);
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            let timeNow = new Date().getTime();
            var timeDiff = timeNow - lastTypingTime;

            if(timeDiff >= timerLength && typing) {
                socket.emit("stop typing", selectedChat._id);
                setTyping(false);
            }
        }, timerLength
        )
    };

    return (
    <>
      {selectedChat ? (
        <>
        <Text
            fontSize={{base: "28px", md:"30px"}}
            pb={3}
            px={2}
            w={"100%"}
            fontFamily={"Work sans"}
            display={"flex"}
            justifyContent={{base:"space-between"}}
            alignItems={"center"}
        >
            <IconButton
                display={{base:"flex",md:"none"}}
                icon={<IoMdArrowRoundBack />}
                onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
                <>
                {getSender(user,selectedChat.users)}
                <ProfileModal user={getSenderFull(user,selectedChat.users)}/>
                </>
            ):(
                <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModel
                fetchAgain={fetchAgain}
                setFetchAgain={setFetchAgain}
                fetchMessages={fetchMessages}
                />
                
                </>
            )}
        </Text>
        <Box
        display={"flex"}
        flexDir={"column"}
        justifyContent={"flex-end"}
        p={3}
        bg={"#E8E8E8"}
        w={"100%"}
        h={"100%"}
        borderRadius={"lg"}
        overflowY={"hidden"}
        >
            {loading ? (
                <Spinner
                    size={"xl"}
                    w={20}
                    h={20}
                    alignSelf={"center"}
                    margin={"auto"}
                />

            ):(
                <div className='messages'>
                <ScrollableChat messages={messages} />
                </div>
            )}
            <FormControl
    onKeyDown={sendMessage}
    isRequired
    mt={3}
>
    {isTyping ? (
        <div>
            <Lottie
                options={defaultOptions}
                width={70}
                style={{ marginBottom: 15, marginLeft: 0 }}
            />
        </div>
    ) : (
        <></>
    )}
            {isRecording ? 
      <>
        <Box
            width={"5rem"}
            display={"flex"}
            justifyContent={"center"}
            alignContent={"center"}
        >
            
        </Box>
      </>
      :null}
<InputGroup>
<Input
    variant={"filled"}
    bg={"#E0E0E0"}
    placeholder='Enter a message..'
    onChange={typingHandler}
    value={newMessage}
/>
<Flex>
    <InputRightElement width="4.5rem" position="relative" >
        <label htmlFor="file-upload" >
            <IconButton className='mic-toggle' icon={<CiImageOn  />} borderRadius="0" />
        </label>
        <input
            id="file-upload"
            type="file"
            style={{
                position: 'absolute',
                opacity: 0,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
            }}
            onChange={handleImageUpload}
        />
    </InputRightElement>
</Flex>
        {isRecording?
        <div onClick={handleVoiceChat}>
    <Lottie
    options={voiceOptions}
    width={50}
    // style={{ marginBottom: 15, marginLeft: 0 }}
    />
    </div>
 :
    <IconButton className="mic-toggle" id="mic" onClick={handleVoiceChat}>
        <TiMicrophoneOutline style={{color:"black"}} />

    </IconButton>
}
</InputGroup>

</FormControl>

        </Box>
        </>
      ):
      (
        <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            h={"100%"}

        >
            <Text fontSize={"3xl"}
            pb={3}
            fontFamily={"Work sans"}>
                Click on a user to start chatting

            </Text>
        </Box>
      )
      }

    </>
  );
}

export default SingleChat;
