import React, { useState } from 'react';
import { Button, IconButton, Typography, Box, CircularProgress } from '@mui/material';
import { AttachFile as AttachFileIcon, Delete as DeleteIcon } from '@mui/icons-material';

const FileAttachment = ({ memoId, attachmentUrl, attachmentName, onUploadSuccess, onDeleteSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/memos/${memoId}/attachment`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      onUploadSuccess(data);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/memos/${memoId}/attachment`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      const data = await response.json();
      onDeleteSuccess(data);
    } catch (err) {
      setError('Failed to delete file. Please try again.');
      console.error('Delete error:', err);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      {attachmentUrl ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AttachFileIcon fontSize="small" />
          <Typography 
            component="a" 
            href={attachmentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'primary.main' }}
          >
            {attachmentName}
          </Typography>
          <IconButton size="small" onClick={handleDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box>
          <input
            type="file"
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          <label htmlFor="file-upload">
            <Button
              component="span"
              variant="outlined"
              startIcon={<AttachFileIcon />}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Uploading...
                </>
              ) : (
                'Attach File'
              )}
            </Button>
          </label>
        </Box>
      )}
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileAttachment; 