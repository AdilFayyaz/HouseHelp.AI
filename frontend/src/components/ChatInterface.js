import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Send,
  Person,
  SmartToy,
} from '@mui/icons-material';
import { chatAPI } from '../services/api';

const ChatInterface = ({ issueId, issueContext }) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize with welcome message
    if (issueId && issueContext) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          message: `Hi! I'm here to help with your repair issue. I have the context of your problem and repair plan. Feel free to ask me any questions about the steps, tools, safety concerns, or anything else related to the repair.`,
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: 1,
          type: 'bot',
          message: `Hello! I'm your AI repair assistant. How can I help you today? You can ask me questions about home repairs, maintenance, or upload an issue first to get specific guidance.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [issueId, issueContext]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      message: currentMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(currentMessage, issueId);
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: response.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Chat with AI Assistant
        </Typography>

        {/* Messages Area */}
        <Paper
          sx={{
            height: 400,
            overflow: 'auto',
            p: 2,
            mb: 2,
            backgroundColor: 'grey.50',
          }}
        >
          {messages.map((message) => (
            <Box key={message.id}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  mb: 2,
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32,
                  }}
                >
                  {message.type === 'user' ? (
                    <Person fontSize="small" />
                  ) : (
                    <SmartToy fontSize="small" />
                  )}
                </Avatar>

                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: message.type === 'user' ? 'primary.main' : 'background.paper',
                    color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.message}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                    }}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 32, height: 32 }}>
                <SmartToy fontSize="small" />
              </Avatar>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">AI is thinking...</Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>

        {/* Message Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about the repair..."
            disabled={isLoading}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!currentMessage.trim() || isLoading}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <Send />
          </Button>
        </Box>

        {/* Quick Suggestions */}
        {issueId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Quick questions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                'Can I skip any steps?',
                'What if I don\'t have the right tools?',
                'Is this safe to do myself?',
                'How much will this cost?',
                'What could go wrong?',
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  size="small"
                  variant="outlined"
                  onClick={() => setCurrentMessage(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatInterface;