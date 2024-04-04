import { Box, Button, Tooltip,Text, Menu, MenuButton, Wrap, WrapItem, Avatar, MenuList, MenuItem, MenuDivider, Drawer, useDisclosure, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, Input, useToast, Spinner } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FaSearch } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { IoIosArrowDown } from "react-icons/io";
import { ChatState } from '../../Context/ChatProvider';
import ProfileModal from './ProfileModal';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatLoading from '../ChatLoading';
import UserListItem from '../UserAvatar/UserListItem';
// import { getSender } from '../../Config/ChatLogics';
// import { Effect } from 'react-notification-badge';
// import NotificationBadge from 'react-notification-badge';
import END_POINT from '../../server';

const SideDrawer = () => {
  const [search,setSearch] = useState("")
  const [searchResult,setSearchResult] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingChat, setLoadingChat] = useState()
  const navigate = useNavigate()
  const {user, setSelectedChat, chats, setChats,notifications,setNotifications } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure()

  const logoutHandler = () => {
    localStorage.removeItem("userInfo")
    navigate("/")
  }

  const toast = useToast();

  const handleSearch =async () => {
    if(!search) {
      toast({
        title:"Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left"
      })
    }
    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const {data} = await axios.get(`${END_POINT}/api/user?search=${search}`,config)
      setLoading(false);
      setSearchResult(data)
    } catch (error) {
      toast({
        title:"Error Occured!",
        description:"Failed to Load the Search Results",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left"
      })
    }
  };

  const accessChat =async (userId) => {
    try {
      setLoadingChat(true);

      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`
        }
      };
      const { data } = await axios.post(`${END_POINT}/api/chat`,{ userId }, config)

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats])

        setSelectedChat(data);
        setLoadingChat(false);
        onClose();
    } catch (error) {
      toast({
        title:"Error fetching the chat",
        description: error.message,
        status:'error',
        duration:5000,
        isClosable:true,
        position:"bottom-left"
      })
    }
  };

  return (
    <>
      <Box
      display={"flex"}
      justifyContent={"space-between"}
      alignItems={"center"}
      bg={"white"}
      p={"5px 10px 5px 10px"}
      borderWidth={"5px"}
      >
        <Tooltip label="Search Users to chat"
        hasArrow
        placement='bottom-end'>
          <Button variant={"ghost"} onClick={onOpen}>
          <FaSearch />
          <Text 
          display={{base:"none",md:"flex"}}
          px={"4"}>
            Search User
          </Text>
          </Button>
        </Tooltip>

        <Text fontSize={"2xl"} fontWeight={"900"} fontFamily={"Work sans"}>
          CHATIEST
        </Text>

        <div>
          {/* <Menu>
            <MenuButton p={1}>
              <NotificationBadge
                count={notifications.length}
                effect={Effect.SCALE}
              />
              <IoIosNotifications  style={{marginRight:"1rem",paddingTop:"10px",fontSize:"31px"}} />

            </MenuButton>
            <MenuList display={"flex"} justifyContent={"center"}>
              {!notifications.length && "No New Messages"}
              {notifications.map((notify) => (
                <MenuItem
                key={notify._id} onClick={() => {
                  setSelectedChat(notify.chat);
                  setNotifications(notifications.filter((n) => n !== notify));
                }}>
                  {notify.chat.isGroupChat
                  ? `New Message in ${notify.chat.chatName}`
                : `New Message from ${getSender(user,notify.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu> */}
          <Menu>
            <MenuButton as={Button} rightIcon={<IoIosArrowDown />}>
                <Avatar size={"sm"} cursor={"pointer"} name={user.name} src={user.pic} />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
              <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider/>
              <MenuItem onClick={logoutHandler}>LogOut</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>
      <Drawer placement='left' onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay/>
        <DrawerContent>
          <DrawerHeader borderBottomWidth={"1px"}>Search Users</DrawerHeader>
        <DrawerBody>
          <Box display={"flex"} pb={2}>
            <Input
              placeholder='Search by name or email'
              mr={2}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button 
            onClick={handleSearch}
            >Go</Button>

          </Box>
          {loading ? (
            <ChatLoading/>
          ):
          (
            searchResult?.map(user => (
              <UserListItem
              key={user._id}
              user={user}
              handleFunction={()=>accessChat(user._id)}/>
            ))
          )}
          {loadingChat && <Spinner ml={"auto"} display={"flex"}/>}
        </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default SideDrawer;
