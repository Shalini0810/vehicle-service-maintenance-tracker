require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 5001;
connectDB()
  .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
  .catch(err => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
