import React, { useState } from 'react';
import axios from 'axios';
import { FormControl, FormLabel, VStack, Input, InputGroup, InputRightElement, Button, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [password, setPassword] = useState('');
    const [pic, setPic] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'chat-app'); // Cloudinary upload preset for your application

        try {
            setLoading(true);
            const response = await axios.post('https://api.cloudinary.com/v1_1/dolpv2sp3/image/upload', formData);
            setPic(response.data.url); // Set the Cloudinary image URL in state
            setLoading(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        if (!name || !email || !password || !confirmPassword) {
            toast({
                title: 'Please Fill all the Fields',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            toast({
                title: 'Passwords do not match',
                status: 'warning',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            setLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const userData = { name, email, password, pic };
            const { data } = await axios.post('http://localhost:5000/api/user', userData, config);
            toast({
                title: 'Registration Successful',
                status: 'success',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setLoading(false);
            navigate('/chat');
            window.location.reload();

        } catch (error) {
            toast({
                title: 'Error Occurred!',
                description: error.response.data.message || 'Something went wrong',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom',
            });
            setLoading(false);
        }
    };

    return (
        <VStack spacing={5}>
            <FormControl>
                <FormLabel>Name</FormLabel>
                <Input placeholder="Enter Your Name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormControl>
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
            <FormControl>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                    <Input
                        placeholder="Confirm Password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={handleTogglePasswordVisibility}>
                            {showPassword ? 'Hide' : 'Show'}
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </FormControl>
            <FormControl>
                <FormLabel>Upload Your Picture</FormLabel>
                <Input type="file" onChange={handleImageUpload} />
            </FormControl>
            <Button
                colorScheme="blue"
                width="100%"
                onClick={handleSubmit}
                isLoading={loading}
                disabled={loading}
            >
                Sign Up
            </Button>
        </VStack>
    );
};

export default SignUp;
