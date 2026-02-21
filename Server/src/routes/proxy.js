const express = require('express');
const router = express.Router();

router.get('/input-tools', async (req, res) => {
  try {
    const { text, itc = 'gu-t-i0-und' } = req.query;
    
    if (!text) {
      return res.status(400).json({ error: 'Text parameter is required' });
    }

    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

module.exports = router;
