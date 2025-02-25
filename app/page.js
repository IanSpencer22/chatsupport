'use client'
import { useState, useRef, useEffect } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import ReactMarkdown from 'react-markdown'; // Add this import

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the Headstarter support assistant. How can I help you today?" },
  ]);

  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setMessage('')
    setIsLoading(true)
    setMessages((messages) => [
      ...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' },
    ])
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([...messages, { role: 'user', content: message }]),
      })
  
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
  
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
  
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text },
          ]
        })
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages((messages) => [
        ...messages,
        { role: 'assistant', content: "I'm sorry, but I encountered an error. Please try again later." },
      ])
    }
    setIsLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      sendMessage()
    }
  }

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Stack
        direction="column"
        width="500px"
        minHeight="700px"
        spacing={3}
        border="1px solid grey"
        borderRadius={10}
        p={2}
      >
        <Stack direction="column" spacing={2} flexGrow={1} overflow="auto" maxHeight="600px">
          {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={ message.role === "assistant" ? "flex-start" : "flex-end" }
              >
                <Box
                  bgcolor={message.role === "assistant" ? "primary.main" : "secondary.main"}
                  color="white"
                  borderRadius={16}
                  p={3}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown> // Use ReactMarkdown here
                  ) : (
                    message.content
                  )}
                </Box>
              </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={sendMessage}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}