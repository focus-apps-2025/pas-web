const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();


// CORS options to allow frontend origins and credentials (cookies)
const allowedOrigins = [
  'https://your-netlify-site.netlify.app', // Production
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman/curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Import your routes
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const rackRoutes = require('./routes/rackRoutes');
const exportedRackRoutes = require('./routes/exportedRackRoutes');
const masterdescRoutes = require('./routes/master_routes');

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/racks', rackRoutes);
app.use('/api/exported-racks-snapshot', exportedRackRoutes);
app.use('/api', masterdescRoutes);

app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
  });
}).catch((err) => console.error('MongoDB connection error:', err));
