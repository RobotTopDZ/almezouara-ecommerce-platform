// Simple development server to run the API standalone on port 5000
const app = require('./index');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
