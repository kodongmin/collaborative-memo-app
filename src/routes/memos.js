const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadToS3, deleteFromS3, getPreSignedUrl } = require('../utils/s3Upload');
const pool = require('../db');

// Create a new memo
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      'INSERT INTO memos (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating memo:', error);
    res.status(500).json({ message: '메모 생성 중 오류가 발생했습니다.' });
  }
});

// Get all memos for a user
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { search, sort = 'newest', favorites } = req.query;

    let query;
    let queryParams = [userId];
    let paramCount = 1;

    if (favorites === 'true') {
      // 즐겨찾기만 조회
      query = `
        SELECT m.*, true as is_favorite,
               CASE WHEN m.user_id = $1 THEN 'owned' ELSE 'shared' END as memo_type
        FROM memos m
        INNER JOIN user_favorites uf ON m.id = uf.memo_id AND uf.user_id = $1
        WHERE m.user_id = $1 OR EXISTS (
          SELECT 1 FROM shared_memos sm WHERE sm.memo_id = m.id AND sm.user_id = $1
        )
      `;
    } else {
      // 전체 메모 조회
      query = `
        SELECT m.*, 
               COALESCE(uf.user_id IS NOT NULL, false) as is_favorite,
               CASE WHEN m.user_id = $1 THEN 'owned' ELSE 'shared' END as memo_type
        FROM memos m
        LEFT JOIN user_favorites uf ON m.id = uf.memo_id AND uf.user_id = $1
        WHERE m.user_id = $1 OR EXISTS (
          SELECT 1 FROM shared_memos sm WHERE sm.memo_id = m.id AND sm.user_id = $1
        )
      `;
    }

    if (search) {
      paramCount++;
      query += ` AND (m.title ILIKE $${paramCount} OR m.content ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (sort === 'oldest') {
      query += ` ORDER BY m.created_at ASC`;
    } else {
      query += ` ORDER BY m.created_at DESC`;
    }

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching memos:', error);
    res.status(500).json({ message: '메모 목록 조회 중 오류가 발생했습니다.' });
  }
});

// Get favorite memos - MUST be before /:id routes
router.get('/favorites', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const memos = await pool.query(
      `SELECT m.* 
       FROM memos m
       INNER JOIN user_favorites uf ON m.id = uf.memo_id
       WHERE uf.user_id = $1 AND uf.is_favorite = true
       ORDER BY m.updated_at DESC`,
      [userId]
    );

    res.json(memos.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific memo
router.get('/:id', auth, async (req, res) => {
  try {
    const memoId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    if (isNaN(memoId)) {
      return res.status(400).json({ message: '잘못된 메모 ID입니다.' });
    }

    const result = await pool.query(
      `SELECT m.*, 
              COALESCE(uf.user_id IS NOT NULL, false) as is_favorite
       FROM memos m
       LEFT JOIN user_favorites uf ON m.id = uf.memo_id AND uf.user_id = $1
       WHERE m.id = $2 AND (m.user_id = $1 OR EXISTS (
         SELECT 1 FROM shared_memos sm WHERE sm.memo_id = m.id AND sm.user_id = $1
       ))`,
      [userId, memoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '메모를 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching memo:', error);
    res.status(500).json({ message: '메모 조회 중 오류가 발생했습니다.' });
  }
});

// Toggle memo favorite status
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const memoId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const { is_favorite } = req.body;

    if (isNaN(memoId)) {
      return res.status(400).json({ message: '잘못된 메모 ID입니다.' });
    }

    if (is_favorite) {
      await pool.query(
        'INSERT INTO user_favorites (user_id, memo_id) VALUES ($1, $2) ON CONFLICT (user_id, memo_id) DO NOTHING',
        [userId, memoId]
      );
    } else {
      await pool.query(
        'DELETE FROM user_favorites WHERE user_id = $1 AND memo_id = $2',
        [userId, memoId]
      );
    }

    res.json({ success: true, is_favorite });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ message: '즐겨찾기 설정 중 오류가 발생했습니다.' });
  }
});

// Update a memo
router.put('/:id', auth, async (req, res) => {
  try {
    const memoId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const userId = req.user.userId;

    if (isNaN(memoId)) {
      return res.status(400).json({ message: '잘못된 메모 ID입니다.' });
    }

    // 메모 소유권 확인
    const memoCheck = await pool.query(
      'SELECT * FROM memos WHERE id = $1 AND (user_id = $2 OR EXISTS (SELECT 1 FROM shared_memos WHERE memo_id = $1 AND user_id = $2))',
      [memoId, userId]
    );

    if (memoCheck.rows.length === 0) {
      return res.status(403).json({ message: '메모에 대한 권한이 없습니다.' });
    }

    const result = await pool.query(
      'UPDATE memos SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [title, content, memoId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '메모를 찾을 수 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating memo:', error);
    res.status(500).json({ message: '메모 수정 중 오류가 발생했습니다.' });
  }
});

// Delete a memo
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM memos WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: '메모를 찾을 수 없습니다.' });
    }

    res.json({ message: '메모가 삭제되었습니다.' });
  } catch (error) {
    console.error('Error deleting memo:', error);
    res.status(500).json({ message: '메모 삭제 중 오류가 발생했습니다.' });
  }
});

// Share a memo with another user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const userId = req.user.userId;

    // Check if the memo exists and belongs to the user
    const memo = await pool.query(
      'SELECT * FROM memos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memo.rows.length === 0) {
      return res.status(404).json({ message: 'Memo not found or unauthorized' });
    }

    // Get the user to share with
    const shareUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (shareUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Share the memo
    await pool.query(
      'INSERT INTO shared_memos (memo_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [id, shareUser.rows[0].id]
    );

    res.json({ message: 'Memo shared successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload file attachment to memo
router.post('/:id/attachment', auth, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if memo exists and belongs to user
    const memo = await pool.query(
      'SELECT * FROM memos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memo.rows.length === 0) {
      return res.status(404).json({ message: 'Memo not found or unauthorized' });
    }

    // Delete existing attachment if any
    if (memo.rows[0].attachment_key) {
      try {
        await deleteFromS3(memo.rows[0].attachment_key);
      } catch (error) {
        console.error('Failed to delete existing file:', error);
      }
    }

    // Upload file to S3
    const uploadResult = await uploadToS3(file);

    // Update memo with attachment info
    const updatedMemo = await pool.query(
      'UPDATE memos SET attachment_url = $1, attachment_key = $2, attachment_name = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [uploadResult.url, uploadResult.key, file.originalname, id, userId]
    );

    res.json(updatedMemo.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Delete file attachment from memo
router.delete('/:id/attachment', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get memo and attachment info
    const memo = await pool.query(
      'SELECT * FROM memos WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (memo.rows.length === 0) {
      return res.status(404).json({ message: 'Memo not found or unauthorized' });
    }

    const { attachment_key } = memo.rows[0];
    if (!attachment_key) {
      return res.status(404).json({ message: 'No attachment found' });
    }

    // Delete file from S3
    await deleteFromS3(attachment_key);

    // Update memo to remove attachment info
    const updatedMemo = await pool.query(
      'UPDATE memos SET attachment_url = NULL, attachment_key = NULL, attachment_name = NULL WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    res.json(updatedMemo.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

module.exports = router; 