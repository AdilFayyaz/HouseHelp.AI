import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  CloudUpload,
  Mic,
  MicOff,
  PhotoCamera,
} from '@mui/icons-material';
import { issuesAPI } from '../services/api';

const ImageUpload = ({ onUploadSuccess }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropzone for image upload
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedImage(file);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Voice recording (placeholder - would need proper implementation)
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual voice recording
    if (!isRecording) {
      setDescription(prev => prev + " [Voice note recorded]");
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedImage || !description.trim()) {
      setError('Please provide both an image and description');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('description', description);

      const result = await issuesAPI.createIssue(formData);
      
      setSuccess('Issue uploaded successfully!');
      setSelectedImage(null);
      setDescription('');
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      setError('Failed to upload issue. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Report a Home Repair Issue
        </Typography>

        {/* Image Upload Area */}
        <Paper
          {...getRootProps()}
          sx={{
            p: 3,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            mb: 3,
            backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          }}
        >
          <input {...getInputProps()} />
          {selectedImage ? (
            <Box>
              <PhotoCamera sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body1" color="success.main">
                Image selected: {selectedImage.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click or drag to replace
              </Typography>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image here, or click to select'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports: JPEG, PNG, GIF, BMP, WebP (Max 10MB)
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Description Input */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Describe the problem"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe what's broken, when it happened, and any symptoms you've noticed..."
          sx={{ mb: 2 }}
        />

        {/* Voice Recording Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant={isRecording ? "contained" : "outlined"}
            color={isRecording ? "error" : "primary"}
            startIcon={isRecording ? <MicOff /> : <Mic />}
            onClick={toggleRecording}
          >
            {isRecording ? 'Stop Recording' : 'Add Voice Note'}
          </Button>
          {isRecording && (
            <Typography variant="body2" color="error">
              Recording... (Feature coming soon)
            </Typography>
          )}
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={isUploading || !selectedImage || !description.trim()}
          startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
        >
          {isUploading ? 'Uploading...' : 'Submit Issue'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;