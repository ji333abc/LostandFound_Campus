const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: process.env.ENV_FILE || '.env' });

// 检查必需的环境变量
if (!process.env.JWT_SECRET) {
  console.error('错误：JWT_SECRET 环境变量未设置');
  console.error('请在 .env 文件中设置 JWT_SECRET');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');

const app = express();

// 支持通过环境变量配置跨域来源：
// - CORS_ORIGIN=* 
// - CORS_ORIGIN=http://localhost:5173
// - CORS_ORIGIN=http://a.com,http://b.com
const corsOriginRaw = process.env.CORS_ORIGIN || '*';
const isDev = (process.env.NODE_ENV || 'development') !== 'production';

let corsOptions;
if (corsOriginRaw === '*' || isDev) {
  // 开发环境默认放开，避免本地端口变化导致联调失败
  corsOptions = { origin: true, credentials: true };
} else {
  const allowList = corsOriginRaw.split(',').map((s) => s.trim()).filter(Boolean);
  corsOptions = {
    origin(origin, callback) {
      if (!origin || allowList.includes(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked: ${origin}`);
      return callback(null, false);
    },
    credentials: true
  };
}

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_lost_found';

mongoose
  .connect(mongoUri, { autoIndex: true })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

app.get('/', (req, res) => {
  res.json({ message: 'Campus lost & found API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 统一错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: '数据验证失败', 
      details: err.message 
    });
  }
  
  // Mongoose CastError (无效的 ID)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: '无效的 ID 格式' });
  }
  
  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Token 无效' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token 已过期' });
  }
  
  // 默认错误
  res.status(err.status || 500).json({
    message: err.message || '服务器错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
  console.log(`ENV_FILE: ${process.env.ENV_FILE || '.env'}`);
});

