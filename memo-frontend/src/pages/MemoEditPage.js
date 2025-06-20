import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const { id: paramId } = useParams();
  
  // 새 메모 작성을 위해 생성된 임시 ID를 관리
  const [memoId, setMemoId] = useState(paramId);
  const isNewMemo = !paramId;
  
  // 페이지를 떠날 때 임시 메모를 삭제하기 위한 참조
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  titleRef.current = title;
  contentRef.current = content;

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    return token;
  }, [navigate]);

  // 임시 메모 삭제 함수
  const deleteTempMemo = useCallback(async (id) => {
    const token = checkAuth();
    if (!token) return;
    try {
      await fetch(`/api/memos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
    } catch (err) {
      console.error("Failed to delete temporary memo:", err);
    }
  }, [checkAuth]);
  
  // 페이지 로드 시 실행되는 로직
  useEffect(() => {
    const token = checkAuth();
    if (!token) return;

    const createOrFetchMemo = async () => {
      setLoading(true);
      if (isNewMemo) {
        // 새 메모인 경우, 제목/내용이 비어있는 임시 메모 생성
        try {
          const response = await fetch('/api/memos', {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: ' ', content: '' }) // 빈 제목으로 임시 생성
          });
          if (!response.ok) throw new Error('Failed to create a temporary memo.');
          const data = await response.json();
          setMemoId(data.id); // 받아온 ID를 상태에 저장
          setTitle(''); // UI에서는 다시 비움
        } catch (err) {
          setError('메모를 생성하는데 실패했습니다. 다시 시도해주세요.');
          console.error(err);
        }
      } else {
        // 기존 메모인 경우, 데이터 불러오기
        try {
          const response = await fetch(`/api/memos/${memoId}`, {
            headers: { 'Authorization': token }
          });
          if (!response.ok) throw new Error('메모를 불러올 수 없습니다.');
          const data = await response.json();
          setTitle(data.title);
          setContent(data.content);
          setAttachmentUrl(data.attachment_url || '');
          setAttachmentName(data.attachment_name || '');
        } catch (err) {
          setError('메모를 불러오는 중 오류가 발생했습니다.');
          console.error(err);
        }
      }
      setLoading(false);
    };

    createOrFetchMemo();
    
    // 컴포넌트가 언마운트될 때 (페이지 이탈 시) 실행
    return () => {
      if (isNewMemo && memoId && !titleRef.current && !contentRef.current) {
        deleteTempMemo(memoId);
      }
    };
  }, [paramId, navigate]); // 의존성 배열 수정

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
        setError("제목은 필수입니다.");
        return;
    }
    
    const token = checkAuth();
    if (!token) return;

    setError('');
    setSaving(true);

    try {
      const response = await fetch(`/api/memos/${memoId}`, {
        method: 'PUT', // 이제 항상 PUT으로 수정
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });

      if (!response.ok) {
        throw new Error('메모 저장에 실패했습니다.');
      }

      navigate('/memos');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
      if (isNewMemo && memoId) {
          deleteTempMemo(memoId);
      }
      navigate('/memos');
  }

  const handleUploadSuccess = (data) => {
    setAttachmentUrl(data.attachment_url);
    setAttachmentName(data.attachment_name);
  };

  const handleDeleteSuccess = () => {
    setAttachmentUrl('');
    setAttachmentName('');
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: 'center' }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {isNewMemo ? '새 메모 준비 중...' : '메모를 불러오는 중...'}
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
          
          {memoId && (
            <FileAttachment
              memoId={memoId}
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
              disabled={saving}
              sx={{ flexGrow: 1 }}
            >
              {saving ? <CircularProgress size={24} /> : '저장'}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCancel}
              disabled={saving}
              sx={{ flexGrow: 1 }}
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