import React, { useEffect } from 'react';
import { Box, Container, Text, Tabs, Tab, TabList, TabPanels, TabPanel } from '@chakra-ui/react';
import Login from '../Components/Authentication/Login';
import SignUp from '../Components/Authentication/SignUp';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {

  const navigate = useNavigate()

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));

    if (user) {
      navigate("/chat")
    }
  }, [navigate])

  return (
    <Container maxW='xl' centerContent>
      <Box
        d='flex'
        justifyContent="center"
        p={3}
        bg={"white"}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px">
        <Text textAlign={"center"} fontSize={"2xl"} fontWeight={"900"} fontFamily={"Work sans"} color={"black"} >CHATIEST</Text>
      </Box>
      <Box
        bg={"white"}
        w={"100%"}
        p={4}
        borderRadius={"lg"}
        color={"black"}
        borderWidth={"1px"}>
        <Tabs variant='soft-rounded' colorScheme='blue'>
          <TabList mb={"1em"}>
            <Tab width={"50%"}>Login</Tab>
            <Tab width={"50%"}>Sign Up</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <p><Login /></p>
            </TabPanel>
            <TabPanel>
              <p><SignUp /></p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
}

export default HomePage;
