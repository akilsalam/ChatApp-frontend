import React, {useEffect,useState} from 'react';
import ScrollToBottom from "react-scroll-to-bottom"
import { isLastMessage, isSameSender, isSameSenderMargin } from '../Config/ChatLogics';
import { ChatState } from '../Context/ChatProvider';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Avatar, Box, Tooltip } from '@chakra-ui/react';
import { FiDownload } from "react-icons/fi";
import { HiDotsHorizontal } from "react-icons/hi";
import END_POINT from '../server';
import io from "socket.io-client"

const ENDPOINT = END_POINT;
var socket, selectedChatCompare;

const ScrollableChat = ({ messages, handleDelete }) => {

    const {user} = ChatState();


    useEffect(() => {
        socket = io(ENDPOINT);
        socket.emit("setup",user);
    });

    const downloadImage = (content) => {
        const base64data = content.replace('data:image/jpeg;base64,', '');
        const blob = base64ToBlob(base64data, 'image/jpeg');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'image.jpeg';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };
      
      const base64ToBlob = (base64Data, contentType) => {
        const sliceSize = 512;
        const byteCharacters = window.atob(base64Data);
        const byteArrays = [];
      
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
          const slice = byteCharacters.slice(offset, offset + sliceSize);
      
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
      
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
      
        const blob = new Blob(byteArrays, { type: contentType });
        return blob;
      };      

    
    
    

  return (
    <div>
        <ScrollToBottom className='scroll'>


        {messages && messages.map((m,i) => (
            <div 
                style={{display:"flex"}}
                key={m._id}
                
            >
                {(isSameSender(messages,m,i,user._id)
                || isLastMessage(messages,i,user._id)
                ) && (
                    <>
                        {/* <strong>{m.sender.name}</strong> */}
                    <Tooltip
                        label={m.sender.name}
                        placement='bottom-start'
                        hasArrow
                        >
                        <Avatar
                            mt={"7px"}
                            mr={1}
                            size={"sm"}
                            cursor={"pointer"}
                            name={m.sender.name}
                            // backgroundColor={"white"}
                            // fontWeight={"900"}
                            src={m.sender.pic}
                            />
                    </Tooltip>
                            </>
                )}

                <span style={{
                    backgroundColor: `${
                        m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                    }`,
                    borderRadius: "10px",
                    padding: "5px 15px",
                    // maxWidth:"75%",
                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                    marginTop: isSameSender(messages, m, i, user._id) ? 3 : 10,
                }}>
                <div className='messageMenu'>
  <Accordion allowToggle>
    <AccordionItem>
                {m.sender.name === user.name && m.content !== "This Message was Deleted" ? (
      <h2>
        <AccordionButton style={{ padding: "0px" }}>
          <HiDotsHorizontal />
        </AccordionButton>
      </h2>
    ) : null}
      <AccordionPanel onClick={() => handleDelete(m._id)} style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "5px", cursor: "pointer" }}>
        Delete this message
      </AccordionPanel>
    </AccordionItem>
  </Accordion>

                </div>
{
    m.content && (
        m.isImage ? (
<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
  <>
    <div style={{ cursor:"pointer", display: "flex", justifyContent: "flex-end", padding: "0.5rem", backgroundColor: "grey", color: "white", borderRadius: "10px", marginBottom: "5px" }}>
      <FiDownload onClick={() => downloadImage(m.content)} />
    </div>
    <img style={{borderRadius:"10px"}} src={`data:image/jpeg;base64,${m.content}`} alt="" >
        
    </img>
  </>
</div>


        ) : m.content.startsWith('blob:') ? (
            (() => {
                try {
                    const base64data = m.content.replace('blob:', '');
                    if (base64data.length > 0) {
                        const binaryString = window.atob(base64data);
                        const bytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        const blob = new Blob([bytes.buffer], { type: 'audio/webm;codecs=opus' });
                        const audioURL = window.URL.createObjectURL(blob);
                        return <audio style={{width:"11.5rem"}} controls src={audioURL}></audio>;
                    } else {
                        return null; // No data after "blob:"
                    }
                } catch (error) {
                    console.error('Error decoding base64 data:', error);
                    return <p>Error decoding audio</p>;
                }
            })()
        ) : m.content
    )
}



                    <hr />
                    <span style={{ fontSize: "10px", display: "flex", justifyContent: "flex-end" }}>
                        {new Date(m.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </span>
            </div>
        ))}
                    </ScrollToBottom>
    </div>
  );
}

export default ScrollableChat;
