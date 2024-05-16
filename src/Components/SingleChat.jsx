import React, { useEffect, useRef, useState } from 'react';
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
import AWS from 'aws-sdk'


const ENDPOINT = END_POINT;
var socket, selectedChatCompare;

AWS.config.update({
    accessKeyId: 'AKIA2UC26SKLUQPSKID6',
    secretAccessKey: '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',
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const SingleChat = ({fetchAgain,setFetchAgain}) => {

    const [messages, setMessages] = useState([]);
    const [loading,setLoading] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [socketConnected, setSocketConnected] = useState(false);
    const [typing,setTyping] = useState(false);
    const [isTyping,setIsTyping] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [recorder, setRecorder] = useState(null);
    // const [chunks, setChunks] = useState([]);
    
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

    useEffect(() => {
        // Listen for the 'message deleted' event
        socket.on('message deleted', (deletedMessageId) => {
            // Update messages state to remove the deleted message
            const updatedMessages = messages.filter(message => message._id !== deletedMessageId);
            setMessages(updatedMessages);
        });
    
        return () => {
            // Clean up by removing the event listener when component unmounts
            socket.off('message deleted');
        };
    }, [messages]); // Include messages in the dependency array to re-register the event listener when messages state changes
    
    const handleDeleteMessage = async (messageId) => {
        try {
            const { data } = await fetch(`${END_POINT}/api/message/${messageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: "This message was deleted" }),
            });
    
            console.log('Message edited successfully', data);
    
            // Update messages after deleting the message
            const updatedMessages = messages.map(message =>
                message._id === messageId ? { ...message, content: "This message was deleted" } : message
            );
            setMessages(updatedMessages);
    
            // Emit event to inform other clients about the deleted message
            socket.emit('delete message', messageId);
        } catch (error) {
            console.error('Error editing message:', error);
        }
    };
    
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
      
        if (!file) {
          console.warn("No file selected");
          // Handle no file selection (e.g., display error message)
          return;
        }
      
        if (file.size === 0) {
          console.warn("Selected file is empty");
          // Handle empty file selection (e.g., display error message)
          return;
        }
      
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'multipart/form-data', // Set for file uploads
            },
          };
      
          const formData = new FormData();
          formData.append('content', file); // Replace 'image' with desired key on backend
          formData.append('chatId', selectedChat._id);
          formData.append('isImage', true);
      
          const { data } = await axios.post(
            `${END_POINT}/api/message`,
            formData,
            config
          );
      
          // Now, emit the image data to the server via socket.io
          socket.emit('new message', data);
          setMessages([...messages, data]);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Handle errors appropriately (e.g., display error message to user)
        }
      };
      

    
    
// Define a ref for storing chunks
const chunksRef = useRef([]);

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
                // Access and update the chunks array via ref
                const chunks = chunksRef.current;
                chunks.push(e.data);
            };
            audioRecorder.start();
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
            // Access the chunks array via ref
            const chunks = chunksRef.current;
            const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
            const reader = new FileReader();
            reader.onload = () => {
                const base64data = reader.result.split(',')[1];
                sendAudio(base64data);
            };
            reader.readAsDataURL(audioBlob);
            chunks.length = 0; // Clear chunks
            setRecorder(null);
        };
        recorder.stop();
    }
};


const sendAudio = async (base64data) => {
    try {
        // Convert base64 data to binary
        const binaryData = atob(base64data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < binaryData.length; i++) {
            view[i] = binaryData.charCodeAt(i);
        }
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/webm;codecs=opus' });

        // Upload the audio file to S3
        const s3 = new AWS.S3();
        console.log("s3",s3);
        const params = {
            Bucket: 'akil-file-upload',
            Key: `audio/${Date.now()}.webm`, // Example key, you may want to adjust it
            Body: audioBlob,
            ACL: 'public-read', // Adjust ACL as per your requirement
        };
        const s3Response = await s3.upload(params).promise();
        const fileKey = s3Response.Key;

            // Save the file key to the database
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                },
            };
            const { data } = await axios.post(
                `${END_POINT}/api/message`,
                {
                    content: fileKey, // Store the S3 file key in the database
                    chatId: selectedChat._id,
                },
                config
            );

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




const sendAudio2 = async (base64data) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            },
        };
        console.log(base64data.length);
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
                <ScrollableChat messages={messages} handleDelete={handleDeleteMessage} />
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
