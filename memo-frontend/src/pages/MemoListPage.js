import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Paper,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import ListIcon from '@mui/icons-material/List';
import GradeIcon from '@mui/icons-material/Grade';

function MemoListPage() {
  const [memos, setMemos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'favorites'
  const [shareDialog, setShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMsg, setShareMsg] = useState('');
  const [selectedMemoId, setSelectedMemoId] = useState(null);
  const navigate = useNavigate();

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return false;
    }
    return token;
  }, [navigate]);

  const fetchMemos = useCallback(async () => {
    try {
      const token = checkAuth();
      if (!token) return;

      const params = new URLSearchParams({
        search: searchTerm,
        sort: sortOption
      });

      if (viewMode === 'favorites') {
        params.append('favorites', 'true');
      }

      const response = await fetch(`http://localhost:3001/api/memos?${params}`, {
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
      
      if (response.ok) {
        const data = await response.json();
        setMemos(data);
      } else {
        throw new Error('Failed to fetch memos');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, [searchTerm, sortOption, viewMode, navigate, checkAuth]);

  useEffect(() => {
    const token = checkAuth();
    if (!token) return;
    fetchMemos();
  }, [fetchMemos, checkAuth]);

  const handleDelete = async (id) => {
    try {
      const token = checkAuth();
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/memos/${id}`, {
        method: 'DELETE',
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
      
      if (response.ok) {
        fetchMemos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleFavorite = async (id, currentStatus) => {
    try {
      const token = checkAuth();
      if (!token) return;

      const response = await fetch(`http://localhost:3001/api/memos/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_favorite: !currentStatus })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        fetchMemos();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = useCallback((id) => {
    const token = checkAuth();
    if (!token) return;
    navigate(`/memos/${id}/edit`);
  }, [navigate, checkAuth]);

  const handleShare = (id) => {
    setSelectedMemoId(id);
    setShareEmail('');
    setShareMsg('');
    setShareDialog(true);
  };

  const handleShareSubmit = async () => {
    setShareMsg('');
    const token = checkAuth();
    if (!token) return;
    if (!shareEmail) {
      setShareMsg('이메일을 입력하세요.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/memos/${selectedMemoId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: shareEmail })
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        setShareMsg('공유 성공!');
        setTimeout(() => {
          setShareDialog(false);
          setShareMsg('');
        }, 2000);
      } else {
        const data = await response.json();
        setShareMsg(data.message || '공유에 실패했습니다.');
      }
    } catch (err) {
      setShareMsg('공유에 실패했습니다.');
    }
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          메모 목록
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/memos/new')}
        >
          새 메모 작성
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="메모 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <Select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <SortIcon />
                </InputAdornment>
              }
            >
              <MenuItem value="newest">최신순</MenuItem>
              <MenuItem value="oldest">오래된순</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewModeChange}
          size="small"
        >
          <ToggleButton value="all">
            <ListIcon sx={{ mr: 1 }} /> 전체
          </ToggleButton>
          <ToggleButton value="favorites">
            <GradeIcon sx={{ mr: 1 }} /> 즐겨찾기
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      <List>
        {memos.map((memo) => (
          <ListItem 
            key={memo.id}
            component={Paper}
            sx={{ 
              mb: 2, 
              p: 2,
              borderLeft: memo.memo_type === 'shared' ? '4px solid #FFD600' : 'none',
              backgroundColor: memo.memo_type === 'shared' ? '#FFF9C4' : 'white'
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {memo.title}
                  {memo.memo_type === 'shared' && (
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        backgroundColor: '#FFD600', 
                        color: '#222', 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }}
                    >
                      공유받은 메모
                    </Typography>
                  )}
                </Box>
              }
              secondary={new Date(memo.created_at).toLocaleDateString()}
              onClick={() => navigate(`/memos/${memo.id}`)}
              sx={{ cursor: 'pointer' }}
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                aria-label="favorite"
                onClick={() => handleToggleFavorite(memo.id, memo.is_favorite)}
                sx={{ mr: 1 }}
              >
                {memo.is_favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}
              </IconButton>
              {memo.memo_type === 'owned' && (
                <IconButton 
                  edge="end" 
                  aria-label="share"
                  onClick={() => handleShare(memo.id)}
                  sx={{ mr: 1 }}
                >
                  <ShareIcon />
                </IconButton>
              )}
              {memo.memo_type === 'owned' && (
                <IconButton 
                  edge="end" 
                  aria-label="edit"
                  onClick={() => handleEdit(memo.id)}
                  sx={{ mr: 1 }}
                >
                  <EditIcon />
                </IconButton>
              )}
              {memo.memo_type === 'owned' && (
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleDelete(memo.id)}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

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
          <Button onClick={handleShareSubmit} variant="contained" sx={{ background: '#FFD600', color: '#222', fontWeight: 700 }}>공유</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MemoListPage; 