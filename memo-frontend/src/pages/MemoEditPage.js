import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import FileAttachment from '../components/FileAttachment';

function MemoEditPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewMemo = !id;

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return token;
  }, [navigate]);

  const fetchMemo = useCallback(async () => {
    const token = checkAuth();
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/memos/${id}`, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('메모를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setTitle(data.title);
      setContent(data.content);
      setAttachmentUrl(data.attachment_url || '');
      setAttachmentName(data.attachment_name || '');
    } catch (error) {
      console.error('Error:', error);
      setError('메모를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, checkAuth]);

  useEffect(() => {
    const token = checkAuth();
    if (!token) return;
    
    if (!isNewMemo) {
      fetchMemo();
    } else {
      setLoading(false);
    }
  }, [isNewMemo, fetchMemo, checkAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = checkAuth();
    if (!token) return;

    setError('');
    setSaving(true);

    try {
      const url = isNewMemo 
        ? 'http://localhost:3001/api/memos'
        : `http://localhost:3001/api/memos/${id}`;

      const method = isNewMemo ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || (isNewMemo ? '메모 생성에 실패했습니다.' : '메모 수정에 실패했습니다.'));
      }

      navigate('/memos');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || (isNewMemo ? '메모 생성 중 오류가 발생했습니다.' : '메모 수정 중 오류가 발생했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSuccess = (data) => {
    setAttachmentUrl(data.attachment_url);
    setAttachmentName(data.attachment_name);
  };

  const handleDeleteSuccess = (data) => {
    setAttachmentUrl('');
    setAttachmentName('');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            메모를 불러오는 중...
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {isNewMemo ? '새 메모 작성' : '메모 수정'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            margin="normal"
            disabled={saving}
          />
          <TextField
            fullWidth
            label="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            margin="normal"
            disabled={saving}
          />
          
          {!isNewMemo && (
            <FileAttachment
              memoId={id}
              attachmentUrl={attachmentUrl}
              attachmentName={attachmentName}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          )}
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={saving}
            >
              {saving ? '저장 중...' : (isNewMemo ? '작성' : '수정')}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate('/memos')}
              disabled={saving}
            >
              취소
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default MemoEditPage; 