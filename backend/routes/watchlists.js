module.exports = (pool) => {
  const express = require('express');
  const router = express.Router();

  // GET /api/watchlists/:userId
  router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    const type = req.query.type; // optional

    try {
      // Filter by type if provided. When requesting type "watchlist"
      // also return entries with NULL type for backwards compatibility.
      let query;
      let values;
      if (type) {
        if (type === 'watchlist') {
          query =
            'SELECT * FROM watchlists WHERE user_id = $1 AND (type = $2 OR type IS NULL)';
          values = [userId, type];
        } else {
          query = 'SELECT * FROM watchlists WHERE user_id = $1 AND type = $2';
          values = [userId, type];
        }
      } else {
        query = 'SELECT * FROM watchlists WHERE user_id = $1';
        values = [userId];
      }

      const watchlistsResult = await pool.query(query, values);
      const watchlists = watchlistsResult.rows;

    // 2. Her watchlist için ilgili hisseleri çek
    const finalData = await Promise.all(watchlists.map(async (list) => {
      const stocksResult = await pool.query(
        'SELECT symbol FROM watchlist_stocks WHERE watchlist_id = $1',
        [list.id]
      );
      return {
        ...list,
        stocks: stocksResult.rows,
      };
    }));

    res.json(finalData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  // POST /api/watchlists
  router.post('/', async (req, res) => {
    const { name, user_id, type } = req.body;
    if (!name || !user_id) {
      return res.status(400).json({ error: 'Eksik parametre' });
    }
    try {
      const result = await pool.query(
        'INSERT INTO watchlists (name, user_id, type) VALUES ($1, $2, $3) RETURNING *',
        [name, user_id, type || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // POST /api/watchlists/:listId/stocks
  router.post('/:listId/stocks', async (req, res) => {
    const { symbol, symbols, quantity, price, note, date } = req.body;
    const { listId } = req.params;

    // Support adding multiple symbols at once
    if (Array.isArray(symbols)) {
      try {
        const inserted = [];
        for (const sym of symbols) {
          const result = await pool.query(
            'INSERT INTO watchlist_stocks (watchlist_id, symbol) VALUES ($1, $2) RETURNING *',
            [listId, sym]
          );
          inserted.push(result.rows[0]);
        }
        return res.status(201).json(inserted);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    if (!symbol) {
      return res.status(400).json({ error: 'Eksik pozisyon bilgisi' });
    }

    try {
      if (quantity && price) {
        const result = await pool.query(
          'INSERT INTO watchlist_stocks (watchlist_id, symbol, quantity, price, note, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [listId, symbol, quantity, price, note || '', date || new Date()]
        );
        return res.status(201).json(result.rows[0]);
      }

      const result = await pool.query(
        'INSERT INTO watchlist_stocks (watchlist_id, symbol) VALUES ($1, $2) RETURNING *',
        [listId, symbol]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/watchlists/:listId/stocks/:symbol
  router.delete('/:listId/stocks/:symbol', async (req, res) => {
    const { listId, symbol } = req.params;
    try {
      await pool.query(
        'DELETE FROM watchlist_stocks WHERE watchlist_id = $1 AND symbol = $2',
        [listId, symbol]
      );
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:listId/stocks', async (req, res) => {
    const { listId } = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM watchlist_stocks WHERE watchlist_id = $1',
        [listId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/watchlists/:listId
  router.delete('/:listId', async (req, res) => {
    const { listId } = req.params;
    try {
      await pool.query('DELETE FROM watchlist_stocks WHERE watchlist_id = $1', [listId]);
      await pool.query('DELETE FROM watchlists WHERE id = $1', [listId]);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

  return router;
};
