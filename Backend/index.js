require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const stenographyRoutes = require('./Steganography/routes');

const app = express();
app.use(express.json());

// MongoDB connection using env
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/finvat';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Stenography routes
app.use('/api/v1/stegnography', stenographyRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
