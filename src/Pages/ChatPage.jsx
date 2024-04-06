import React, { useEffect, useState } from 'react';
import { ChatState } from '../Context/ChatProvider';
import { Box } from '@chakra-ui/react';
import SideDrawer from '../Components/miscellaneous/SideDrawer';
import MyChats from '../Components/MyChats';
import ChatBox from '../Components/ChatBox';
import { useNavigate } from 'react-router-dom';

const ChatPage = () => {
  const { user } =ChatState();
  const [fetchAgain,setFetchAgain] = useState(false);

  const navigate = useNavigate()

  useEffect(() => {
      const user = JSON.parse(localStorage.getItem("userInfo"));

      if(!user) {
          navigate("/")
      }
  },[navigate])

  return (
    <div style={{ width: "100%" }}>
      {user && <SideDrawer/>}
      <Box 
      display={"flex"}
      justifyContent={"space-between"}
      w={"100%"}
      h={"91.5vh"}
      p={"10px"}
      >
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}/>}

      </Box>
    </div>
  );
};

export default ChatPage;

