import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack, useToast } from '@chakra-ui/react';
import React,{useState} from 'react';
import axios from 'axios';
import END_POINT from '../../server';


const Login = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading,setLoading] = useState(false)
    const toast = useToast()

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const submitHandler = async() => {
        setLoading(true);
        if(!email || !password ) {
            toast({
                title: 'Please Fill all the Fields',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position:'bottom',
              });
              setLoading(false)
              return;
        }

        try {
            const config = {
                headers: {
                    "Content-type" : "application/json",
                },
            }
            const {data} = await axios.post(
                `${END_POINT}/api/user/login`,
                { email, password },
                config
            );
            toast({
                title: 'Login Successfull',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position:'bottom',
              });

              localStorage.setItem("userInfo", JSON.stringify(data));
              setLoading(false)
              window.location.reload();
              
        } catch (error) {
            toast({
                title: 'Error Occured!',
                description: error.response.data.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
                position:'bottom',
              });
              setLoading(false)
        }
    };

    return (
        <VStack spacing={5}>
            <FormControl>
                <FormLabel>Email</FormLabel>
                <Input placeholder="Enter Your Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                    <Input
                        placeholder="Enter A Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleTogglePasswordVisibility}>
                            {showPassword ? 'Hide' : 'Show'}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>
            <Button 
                colorScheme='blue'
                width={"100%"}
                style={{marginTop: 15}}
                onClick={submitHandler}
                isLoading={loading}
            >
                Login
            </Button>
        </VStack>
    );
};

export default Login;
