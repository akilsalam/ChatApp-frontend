import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import axios from 'axios';
import { Box, Button, Stack, Text, useToast } from '@chakra-ui/react';
import { IoIosAdd } from "react-icons/io";
import ChatLoading from './ChatLoading';
import { getSender } from '../Config/ChatLogics';
import GroupChatModel from './miscellaneous/GroupChatModel';
import { CiImageOn } from "react-icons/ci";
import io from "socket.io-client"
import { MdOutlineKeyboardVoice } from "react-icons/md";
import { MdOutlineMessage } from "react-icons/md";
import END_POINT from "../server"


const socket = io(END_POINT);


const MyChats = ({ fetchAgain }) => {
    const [loggedUser, setLoggedUser] = useState();
  
    const { selectedChat, setSelectedChat, user, chats, setChats } = ChatState();
  
    const toast = useToast();

    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        socket.emit("setup", user);
        socket.on('user online', (onlineUsers) => {
            setOnlineUsers(onlineUsers);
        });
    }, [user]);
  

    const fetchChats = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
  
        const { data } = await axios.get(`${END_POINT}/api/chat`, config);
        setChats(data);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to Load the chats",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-left",
        });
      }
    };
  
    useEffect(() => {
      setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
      fetchChats();
      // eslint-disable-next-line
    }, [fetchAgain]);


    const formatMessageTime = (updatedAt) => {
      const today = new Date();
      const messageDate = new Date(updatedAt);
      const diffTime = today.getTime() - messageDate.getTime();
      
      // Get the number of milliseconds in a day
      const oneDay = 1000 * 60 * 60 * 24;
      
      // Check if the message was sent yesterday
      if (diffTime < oneDay && messageDate.getDate() !== today.getDate()) {
          return "Yesterday";
      }
      
      // Check if the message was sent before yesterday
      if (diffTime >= oneDay) {
          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          return daysOfWeek[messageDate.getDay()];
      }
      
      // Otherwise, return the time
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
    return (
          <Box
            display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
            flexDirection="column"
            alignItems="center"
            padding={3}
            background="white"
            width={{ base: "100%", md: "31%" }}
            borderRadius="lg"
            borderWidth="1px"
          >
            <Box
              paddingBottom={3}
              paddingLeft={3}
              fontSize={{ base: "20px", md: "30px" }}
              fontFamily="Work Sans"
              
              display="flex"
              width="100%"
              justifyContent="space-between"
              alignItems="center"
            >
              Chats
              <GroupChatModel>
              <Button
                display={'flex'}
                fontSize={{ base: "15px", md: "10px", lg: "17px"}}
                rightIcon={<IoIosAdd />}
                >
                New Group Chat
              </Button>
                </GroupChatModel>
            </Box>
            <Box
                display={"flex"}
                flexDir={"column"}
                p={3}
                bg={"#F8F8F8"}
                w={"100%"}
                h={"100%"}
                borderRadius={"lg"}
                overflow={"hidden"}
            >

{chats ? (
    <Stack overflowY={"scroll"} position="relative">
        {chats.map((chat) => (
            <Box key={chat._id} position="relative">
                <Box
                    onClick={() => setSelectedChat(chat)}
                    cursor={"pointer"}
                    bg={selectedChat === chat ? "#38B2AC" : "#E8E8E8"}
                    color={selectedChat === chat ? "white" : "black"}
                    px={3}
                    py={2}
                    borderRadius={"lg"}
                    marginBottom="1rem"
                    position="relative"
                >
                    <Text>
                        {!chat.isGroupChat ?
                            getSender(loggedUser, chat.users)
                            : chat.chatName}
                    </Text>
                    {chat.latestMessage && chat.latestMessage.content && (
    <div style={{ display: "flex", alignItems: "center" }}>
        {chat.latestMessage.isImage ? (
            <>
                <CiImageOn style={{ fontSize: "15px", marginRight: "5px" }} />
                <span style={{ fontSize: "12px" }}>Image</span>
            </>
        ) : chat.latestMessage.content.startsWith('blob:') ? ( // Changed the parentheses here
            <>
            <MdOutlineKeyboardVoice style={{ fontSize: "15px", marginRight: "5px" }}/>
            <span style={{ fontSize: "12px" }}>Voice Message</span>
            </>
        ) : (
          <>
          <MdOutlineMessage style={{ fontSize: "15px", marginRight: "5px" }}/>
            <span style={{ fontSize: "12px" }}>{chat.latestMessage.content}</span>
          </>
        )}
    </div>
)}

 
                </Box>
                
                <Box
                    position="absolute"
                    top="5px"
                    right="5px"
                    fontSize="12px"
                    color="#666"
                >
                    {formatMessageTime(chat.updatedAt)}
                </Box>
                <Box
  position="absolute"
  bottom="20px"
  right="5px"
  fontSize="12px"
  color="#666"
  display="flex" // Set display to flex
  alignItems="center" // Align items vertically
>
{!chat.isGroupChat &&
  onlineUsers.length > 0 &&
  chat.users.length > 0 && (
    <>
      {/* {chat.users.map((user) => ( */}
        <div
          // key={user._id}
          style={{
            background: onlineUsers.map((onlineUser) => onlineUser._id).includes(chat.users[1]._id) ? "green" : null,
            width: "10px",
            height: "10px",
            display: "flex",
            borderRadius: "100%",
            marginRight: "3px"
          }}
        ></div>
      {/* ))} */}
    </>
  )
}


</Box>

                
            </Box>
        ))}
    </Stack>
) : (
    <ChatLoading />
)}


            </Box>
          </Box>
      );
      
}

export default MyChats;
