import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Container, Box, TextField, Button, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import FileAttachment from '../components/FileAttachment';

const API_BASE = '/api/memos';

const MemoDetailPage = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    axios.get(`${API_BASE}/${id}`, {
      headers: { 'Authorization': token }
    })
      .then(res => {
        setTitle(res.data.title);
        setContent(res.data.content);
        setAttachmentUrl(res.data.attachment_url || '');
        setAttachmentName(res.data.attachment_name || '');
        setLoading(false);
        const myUserId = JSON.parse(atob(token.split('.')[1])).userId;
        setIsReadOnly(res.data.user_id !== myUserId);
      })
      .catch(err => {
        setError('메모를 불러오지 못했습니다.');
        setLoading(false);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, [id, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!title || !content) {
      setError('제목과 내용을 입력하세요.');
      return;
    }
    setLoading(true);
    try {
      await axios.put(`${API_BASE}/${id}`, { title, content }, {
        headers: { 'Authorization': token }
      });
      navigate('/memos');
    } catch (err) {
      setError('메모 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: { 'Authorization': token }
      });
      navigate('/memos');
    } catch (err) {
      setError('메모 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
      setDeleteDialog(false);
    }
  };

  const handleShare = async () => {
    setShareMsg('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    if (!shareEmail) {
      setShareMsg('이메일을 입력하세요.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/${id}/share`, { email: shareEmail }, {
        headers: { 'Authorization': token }
      });
      setShareMsg('공유 성공!');
    } catch (err) {
      setShareMsg(err.response?.data?.message || '공유에 실패했습니다.');
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
    return <Box display="flex" justifyContent="center" mt={8}><Typography>로딩 중...</Typography></Box>;
  }

  return (
    <Container maxWidth="sm">
      <Box mt={6}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            메모 상세/수정
          </Typography>
          <form onSubmit={handleSave}>
            {isReadOnly && (
              <Typography align="center" color="#FFD600" sx={{ fontWeight: 600, mb: 1 }}>
                이 메모는 읽기 전용입니다 (공유받은 메모)
              </Typography>
            )}
            <TextField
              label="제목"
              fullWidth
              margin="normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isReadOnly}
              sx={{
                background: '#fff',
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(255,214,0,0.07)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD600',
                    boxShadow: '0 0 0 2px #FFF9C4'
                  }
                }
              }}
            />
            <TextField
              label="내용"
              fullWidth
              margin="normal"
              multiline
              minRows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              disabled={isReadOnly}
              sx={{
                background: '#fff',
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(255,214,0,0.07)',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&.Mui-focused fieldset': {
                    borderColor: '#FFD600',
                    boxShadow: '0 0 0 2px #FFF9C4'
                  }
                }
              }}
            />
            
            {!isReadOnly && (
              <FileAttachment
                memoId={id}
                attachmentUrl={attachmentUrl}
                attachmentName={attachmentName}
                onUploadSuccess={handleUploadSuccess}
                onDeleteSuccess={handleDeleteSuccess}
              />
            )}
            
            {error && (
              <Typography color="error" align="center">{error}</Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                background: '#FFD600',
                color: '#222',
                fontWeight: 700,
                fontSize: 18,
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(255,214,0,0.10)',
                transition: 'transform 0.15s',
                '&:hover': {
                  background: '#FFEB3B',
                  transform: 'scale(1.01)'
                }
              }}
              disabled={loading || isReadOnly}
            >
              저장하기
            </Button>
            <Button
              variant="outlined"
              color="error"
              fullWidth
              sx={{ mt: 1, borderRadius: 2, fontWeight: 600, borderWidth: 2, borderColor: '#FFD600', color: '#FFD600' }}
              onClick={() => setDeleteDialog(true)}
              disabled={loading || isReadOnly}
            >
              삭제하기
            </Button>
            <Button
              variant="outlined"
              startIcon={<ShareIcon />}
              fullWidth
              sx={{ mt: 1, borderRadius: 2, fontWeight: 600, borderWidth: 2, borderColor: '#FFD600', color: '#FFD600' }}
              onClick={() => setShareDialog(true)}
            >
              공유
            </Button>
            <Button
              variant="text"
              fullWidth
              sx={{ mt: 1, color: '#FFD600', fontWeight: 600 }}
              onClick={() => navigate('/memos')}
            >
              목록으로
            </Button>
          </form>
        </Paper>
      </Box>
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>메모 삭제</DialogTitle>
        <DialogContent>정말로 이 메모를 삭제하시겠습니까?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>취소</Button>
          <Button onClick={handleDelete} color="error">삭제</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={shareDialog} onClose={() => { setShareDialog(false); setShareMsg(''); }}>
        <DialogTitle>메모 공유</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={1}>공유할 사용자의 이메일을 입력하세요.</Typography>
          <TextField
            label="이메일"
            fullWidth
            value={shareEmail}
            onChange={e => setShareEmail(e.target.value)}
            sx={{ mt: 1, mb: 1 }}
          />
          {shareMsg && <Typography color={shareMsg === '공유 성공!' ? 'primary' : 'error'}>{shareMsg}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShareDialog(false); setShareMsg(''); }}>취소</Button>
          <Button onClick={handleShare} variant="contained" sx={{ background: '#FFD600', color: '#222', fontWeight: 700 }}>공유</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MemoDetailPage; 