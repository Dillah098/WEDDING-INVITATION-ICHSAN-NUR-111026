const express = require('express');
const path = require('path');
const api = require('./api/index.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', api);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
