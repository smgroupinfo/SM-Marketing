const fs = require('fs');

const serverCode = `
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'smm_super_secret_key_2026_xyz';

// IN-MEMORY MOCK DB
const mockUsers = [];
const mockShifts = [];
const mockVisits = [];
const mockFirms = [
  {
    id: 'f1111111-1111-1111-1111-111111111111',
    exec_id: '00000000-0000-0000-0000-000000000000',
    name: 'Alpha Corp',
    gstin: '22AAAAA0000A1Z5',
    address: '123 Alpha Street, Tech Park',
    brands_handled: 'UltraTech, ACC',
    prices: { purchase: 300, retail: 330, wholesale: 315 },
    location: { lat: 12.9716, lng: 77.5946 },
    timestamp: new Date().toISOString()
  }
];

let globalConfig = {
  kmRate: 5,
  foodingAllowance: 250,
  incentives: [
    { id: '1', name: 'Cement', unit: 'Bags', rate: 10 },
    { id: '2', name: 'Steel', unit: 'MT', rate: 50 },
    { id: '3', name: 'Pipes', unit: 'Pcs', rate: 10 }
  ]
};

// PRE-SEED ADMIN
(async () => {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  mockUsers.push({
    user_id: '00000000-0000-0000-0000-000000000000',
    full_name: 'Admin Test User',
    phone_number: '1234567890',
    current_address: 'HQ',
    email: 'admin@test.com',
    password_hash: passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
    supervisor: ''
  });
})();

// AUTH MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });
  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = decodedUser;
    next();
  });
};

// ==========================================
// API ENDPOINTS
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', now: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { fullName, phoneNumber, currentAddress, email, password, role } = req.body;
  if (mockUsers.find(u => u.email === email || u.phone_number === phoneNumber)) {
    return res.status(400).json({ error: 'User already exists.' });
  }
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser = {
    user_id: crypto.randomUUID(),
    full_name: fullName,
    phone_number: phoneNumber,
    current_address: currentAddress,
    email,
    password_hash: passwordHash,
    role: role || 'EXECUTIVE',
    status: 'PENDING',
    supervisor: ''
  };
  mockUsers.push(newUser);
  res.json({ message: 'Registration successful. Waiting for admin approval.' });
});

app.post('/api/auth/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;
  const user = mockUsers.find(u => u.email === emailOrPhone || u.phone_number === emailOrPhone);
  if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });
  
  if (user.role !== 'ADMIN' && user.status === 'PENDING') {
    return res.status(403).json({ error: 'Account pending admin approval.' });
  }
  if (user.role !== 'ADMIN' && user.status === 'DISABLED') {
    return res.status(403).json({ error: 'Account disabled.' });
  }

  const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ message: 'Login successful!', token, user: { userId: user.user_id, fullName: user.full_name, email: user.email, phone: user.phone_number, role: user.role, status: user.status } });
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = mockUsers.find(u => u.user_id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ fullName: user.full_name, email: user.email, phoneNumber: user.phone_number, role: user.role, status: user.status });
});

app.put('/api/user/update', authenticateToken, (req, res) => {
  const user = mockUsers.find(u => u.user_id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.fullName) user.full_name = req.body.fullName;
  if (req.body.phoneNumber) user.phone_number = req.body.phoneNumber;
  res.json({ message: 'Profile updated' });
});

// Admin config
app.get('/api/admin/config', authenticateToken, (req, res) => {
  res.json(globalConfig);
});
app.put('/api/admin/config', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  globalConfig = req.body;
  res.json({ config: globalConfig });
});

// Admin Users
app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  res.json({ users: mockUsers });
});
app.put('/api/admin/users/:id/approve', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const user = mockUsers.find(u => u.user_id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { status, role, supervisor } = req.body;
  if (status) user.status = status;
  if (role) user.role = role;
  if (supervisor) user.supervisor = supervisor;
  res.json({ message: 'User updated successfully', user });
});

// Admin Dashboard
app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  const salesReport = {
    totalBilling: 154500,
    byUnit: [
      { unit: 'Bags', quantity: 350 },
      { unit: 'MT', quantity: 25 },
      { unit: 'Pcs', quantity: 120 }
    ]
  };

  const paymentReport = {
    totalCollections: 85000,
    byMode: [
      { mode: 'UPI', amount: 35000, count: 12 },
      { mode: 'NEFT', amount: 25000, count: 2 },
      { mode: 'Cash', amount: 15000, count: 5 },
      { mode: 'Cheque', amount: 10000, count: 1 }
    ],
    recentTransactions: [
      { id: 'tx-1', mode: 'UPI', amount: 5000, client: 'Alpha Corp', time: '10:30 AM' },
      { id: 'tx-2', mode: 'Cash', amount: 2000, client: 'Beta LLC', time: '11:15 AM' },
      { id: 'tx-3', mode: 'NEFT', amount: 25000, client: 'Gamma Inc', time: '01:00 PM' }
    ]
  };

  const execActivity = mockUsers.filter(u => u.role !== 'ADMIN').map((u, i) => ({
    id: u.user_id,
    name: u.full_name,
    status: i % 2 === 0 ? 'Active' : 'Off Duty',
    startOdometer: i % 2 === 0 ? '14500' : '-',
    totalVisitsToday: i % 2 === 0 ? 4 : 0
  }));

  const liveLocation = execActivity.filter(e => e.status === 'Active').map((e, idx) => ({
    id: e.id,
    name: e.name,
    lat: 12.9716 + (Math.random() * 0.05 * (idx % 2 === 0 ? 1 : -1)),
    lng: 77.5946 + (Math.random() * 0.05 * (idx % 2 === 0 ? 1 : -1)),
    lastUpdated: new Date().toLocaleTimeString()
  }));

  const routeHistory = {
    date: new Date().toLocaleDateString(),
    totalShiftKms: 120.5,
    stops: [
      { id: 1, time: '09:00 AM', name: 'Start Shift (HQ)', lat: 12.9300, lng: 77.6100 },
      { id: 2, time: '10:30 AM', name: 'Alpha Corp', lat: 12.9500, lng: 77.5800 },
      { id: 3, time: '12:45 PM', name: 'Beta LLC', lat: 12.9700, lng: 77.6000 },
      { id: 4, time: '03:15 PM', name: 'Gamma Inc', lat: 12.9900, lng: 77.5900 }
    ]
  };

  res.json({
    kpis: {
      activeExecutives: execActivity.filter(e => e.status === 'Active').length,
      totalFieldKmsToday: 120.5,
      totalVisitsToday: execActivity.reduce((sum, e) => sum + e.totalVisitsToday, 0),
      pendingVerifications: 2
    },
    activity: execActivity,
    salesReport,
    paymentReport,
    liveLocation,
    routeHistory
  });
});

// START SERVER
const PORT = 3000;
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = require('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚀 SMM Backend running on http://localhost:\${PORT}\`);
  });
}
startServer();
\`

fs.writeFileSync('server.js', serverCode);
