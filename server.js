require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'smm_super_secret_key_2026_xyz';

// IN-MEMORY CLEAN PRODUCTION DATABASE (Fresh state)
const mockUsers = [];
const mockShifts = [];
const mockVisits = [];
const mockFirms = [];

let globalConfig = {
  kmRate: 5,
  foodingAllowance: 250,
  incentives: [
    { id: '1', name: 'Cement (UltraTech / ACC)', unit: 'Bags', rate: 10 },
    { id: '2', name: 'TMT Steel (Tata Tiscon / Jindal)', unit: 'MT', rate: 50 },
    { id: '3', name: 'Pipes & Fittings', unit: 'Pcs', rate: 10 },
    { id: '4', name: 'Sand & Aggregates', unit: 'CFT', rate: 2 },
    { id: '5', name: 'Bricks & Blocks', unit: 'Pcs', rate: 1 }
  ]
};

// INITIALIZE ADMIN ACCOUNT ONLY
// Admin Number: 9435188967 | Password: admin123
(async () => {
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  
  mockUsers.push({
    user_id: 'admin-0000-0000-0000-000000000001',
    full_name: 'Sundaram Mahadeo Admin',
    phone_number: '9435188967',
    current_address: 'HQ Central Office, Sundaram Mahadeo Group',
    email: 'admin@sundarammahadeogroup.com',
    password_hash: adminHash,
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
// AUTH & USER ENDPOINTS
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', now: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { fullName, phoneNumber, currentAddress, email, password, role } = req.body;
  if (!phoneNumber || !fullName || !password) {
    return res.status(400).json({ error: 'Full name, phone number, and password are required.' });
  }

  const existing = mockUsers.find(u => 
    (phoneNumber && u.phone_number === phoneNumber.trim()) || 
    (email && u.email && u.email.toLowerCase() === email.trim().toLowerCase())
  );
  if (existing) {
    return res.status(400).json({ error: 'A user with this phone number or email already exists.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const newUser = {
    user_id: crypto.randomUUID(),
    full_name: fullName.trim(),
    phone_number: phoneNumber.trim(),
    current_address: currentAddress ? currentAddress.trim() : 'Field Zone',
    email: email ? email.trim() : `${phoneNumber.trim()}@smm.com`,
    password_hash: passwordHash,
    role: role || 'EXECUTIVE',
    status: 'PENDING', // All executive registrations start as PENDING for admin approval
    supervisor: ''
  };
  mockUsers.push(newUser);
  res.json({ message: 'Registration submitted successfully. Waiting for administrator approval in UMS.' });
});

app.post('/api/auth/login', async (req, res) => {
  const { emailOrPhone, password } = req.body;
  if (!emailOrPhone || !password) {
    return res.status(400).json({ error: 'Phone number/Email and password are required.' });
  }

  const query = emailOrPhone.trim();
  const user = mockUsers.find(u => 
    u.phone_number === query || 
    (u.email && u.email.toLowerCase() === query.toLowerCase())
  );

  if (!user) return res.status(401).json({ error: 'Invalid credentials. Please verify your phone number / password.' });
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials. Please check your password.' });
  
  if (user.role !== 'ADMIN' && user.status === 'PENDING') {
    return res.status(403).json({ error: 'Account pending admin approval. Please contact the administrator.' });
  }
  if (user.role !== 'ADMIN' && user.status === 'DISABLED') {
    return res.status(403).json({ error: 'Account disabled. Please contact the administrator.' });
  }

  const token = jwt.sign({ userId: user.user_id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ 
    message: 'Login successful!', 
    token, 
    user: { 
      userId: user.user_id, 
      fullName: user.full_name, 
      email: user.email, 
      phone: user.phone_number, 
      role: user.role, 
      status: user.status 
    } 
  });
});

app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = mockUsers.find(u => u.user_id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ fullName: user.full_name, email: user.email, phoneNumber: user.phone_number, role: user.role, status: user.status });
});

app.put('/api/user/update', authenticateToken, (req, res) => {
  const user = mockUsers.find(u => u.user_id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (req.body.fullName) user.full_name = req.body.fullName.trim();
  if (req.body.phoneNumber) user.phone_number = req.body.phoneNumber.trim();
  res.json({ message: 'Profile updated successfully' });
});

// ==========================================
// SHIFT MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/shifts/current', authenticateToken, (req, res) => {
  const activeShift = mockShifts.find(s => s.userId === req.user.userId && s.status === 'ACTIVE');
  if (!activeShift) {
    return res.json({ shift: null, shiftStatus: 'OFF_DUTY' });
  }
  res.json({ shift: activeShift, shiftStatus: 'ACTIVE' });
});

app.post('/api/shifts/start', authenticateToken, (req, res) => {
  const { openingOdometer, openingPhoto, startLocation, startTime } = req.body;
  
  if (openingOdometer === undefined || openingOdometer === null || openingOdometer === '') {
    return res.status(400).json({ error: 'Valid opening odometer reading is required.' });
  }

  // Check if already active
  const existingActive = mockShifts.find(s => s.userId === req.user.userId && s.status === 'ACTIVE');
  if (existingActive) {
    return res.json({ message: 'Shift already active', shift: existingActive, shiftStatus: 'ACTIVE' });
  }

  const shiftId = 'shift_' + Date.now();
  const newShift = {
    id: shiftId,
    userId: req.user.userId,
    openingOdometer: parseFloat(openingOdometer),
    openingPhoto: openingPhoto || '',
    startLocation: startLocation || { lat: 23.3441, lng: 85.3096 },
    startTime: startTime || new Date().toISOString(),
    status: 'ACTIVE',
    visitsCount: 0,
    closingOdometer: null,
    closingPhoto: null,
    endTime: null,
    totalKms: 0,
    incentives: 0
  };

  mockShifts.push(newShift);
  res.json({ message: 'Shift started successfully', shift: newShift, shiftStatus: 'ACTIVE', activeShiftId: shiftId });
});

app.post('/api/shifts/close', authenticateToken, (req, res) => {
  const { shiftId, activeShiftId, closingOdometer, closingPhoto, endTime, closeLocation } = req.body;
  const targetId = shiftId || activeShiftId;

  let shift = null;
  if (targetId) {
    shift = mockShifts.find(s => (s.id === targetId || String(s.id) === String(targetId)) && s.userId === req.user.userId);
  }
  
  if (!shift) {
    shift = mockShifts.find(s => s.userId === req.user.userId && s.status === 'ACTIVE');
  }

  if (!shift) {
    return res.status(404).json({ error: 'Shift not found or already closed.' });
  }

  const closingOdoNum = parseFloat(closingOdometer);
  if (isNaN(closingOdoNum) || closingOdoNum < shift.openingOdometer) {
    return res.status(400).json({ 
      error: `Closing odometer (${closingOdoNum}) cannot be less than opening odometer (${shift.openingOdometer}).` 
    });
  }

  const totalKms = parseFloat((closingOdoNum - shift.openingOdometer).toFixed(1));
  const kmRate = globalConfig.kmRate || 5;
  const fooding = globalConfig.foodingAllowance || 250;
  const calculatedIncentive = (totalKms * kmRate) + fooding + (shift.visitsCount * 50);

  shift.status = 'COMPLETED';
  shift.closingOdometer = closingOdoNum;
  shift.closingPhoto = closingPhoto || '';
  shift.endTime = endTime || new Date().toISOString();
  shift.closeLocation = closeLocation || { lat: 23.3441, lng: 85.3096 };
  shift.totalKms = totalKms;
  shift.incentives = calculatedIncentive;

  res.json({
    message: 'Shift closed successfully',
    shift,
    shiftStatus: 'OFF_DUTY',
    summary: {
      totalKms,
      visitsCount: shift.visitsCount,
      incentives: calculatedIncentive
    }
  });
});

// ==========================================
// VISITS & PAYMENT LOGGING ENDPOINTS
// ==========================================

app.get('/api/visits', authenticateToken, (req, res) => {
  const { date, firmName } = req.query;
  let userVisits = mockVisits.filter(v => v.exec_id === req.user.userId || v.userId === req.user.userId || req.user.role === 'ADMIN');
  if (date) {
    userVisits = userVisits.filter(v => {
      const vDate = (v.paymentDate || v.timestamp || v.createdAt || '').split('T')[0];
      return vDate === date;
    });
  }
  if (firmName) {
    userVisits = userVisits.filter(v => (v.firmName || '').toLowerCase().includes(firmName.toLowerCase()));
  }
  res.json({ visits: userVisits });
});

app.post('/api/visits', authenticateToken, (req, res) => {
  const { 
    firmName, purpose, notes, photo, location, 
    product, quantity, unit, bagIncentive, orderValue, 
    collectedAmount, paymentMode, txnId, paymentDate, productsDiscussed 
  } = req.body;
  
  if (!firmName) {
    return res.status(400).json({ error: 'Firm name is required.' });
  }

  const visitId = 'visit_' + Date.now();
  const nowISO = new Date().toISOString();
  const todayStr = nowISO.split('T')[0];
  
  const newVisit = {
    id: visitId,
    exec_id: req.user.userId,
    userId: req.user.userId,
    firmName: firmName.trim(),
    purpose: purpose || 'Sales',
    product: product || 'Cement (UltraTech / ACC)',
    quantity: parseFloat(quantity) || 0,
    unit: unit || 'Bags',
    bagIncentive: parseFloat(bagIncentive) || 0,
    orderValue: parseFloat(orderValue) || 0,
    collectedAmount: parseFloat(collectedAmount) || 0,
    paymentMode: parseFloat(collectedAmount) > 0 ? (paymentMode || 'Cash') : 'None',
    txnId: txnId || '',
    paymentDate: paymentDate || todayStr,
    notes: notes || '',
    photo: photo || '',
    location: location || { lat: 23.3441, lng: 85.3096 },
    productsDiscussed: productsDiscussed || [],
    status: 'VERIFIED',
    timestamp: nowISO,
    createdAt: nowISO
  };

  mockVisits.unshift(newVisit);

  const activeShift = mockShifts.find(s => s.userId === req.user.userId && s.status === 'ACTIVE');
  if (activeShift) {
    activeShift.visitsCount = (activeShift.visitsCount || 0) + 1;
  }

  res.json({ message: 'Visit logged successfully', visit: newVisit });
});

app.put('/api/visits/:id', authenticateToken, (req, res) => {
  const visitIndex = mockVisits.findIndex(v => v.id === req.params.id);
  if (visitIndex === -1) {
    return res.status(404).json({ error: 'Visit record not found.' });
  }

  const existing = mockVisits[visitIndex];
  if (existing.userId !== req.user.userId && existing.exec_id !== req.user.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to modify this visit record.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const visitDate = (existing.timestamp || existing.createdAt || '').split('T')[0];
  if (visitDate !== todayStr && req.user.role !== 'ADMIN') {
    return res.status(400).json({ error: 'Policy Error: Edit is ONLY permitted for today\'s logs.' });
  }

  const { 
    firmName, purpose, notes, photo, location, 
    product, quantity, unit, bagIncentive, orderValue, 
    collectedAmount, paymentMode, txnId, paymentDate 
  } = req.body;

  const updatedVisit = {
    ...existing,
    firmName: firmName ? firmName.trim() : existing.firmName,
    purpose: purpose || existing.purpose,
    product: product !== undefined ? product : existing.product,
    quantity: quantity !== undefined ? (parseFloat(quantity) || 0) : existing.quantity,
    unit: unit || existing.unit,
    bagIncentive: bagIncentive !== undefined ? (parseFloat(bagIncentive) || 0) : existing.bagIncentive,
    orderValue: orderValue !== undefined ? (parseFloat(orderValue) || 0) : existing.orderValue,
    collectedAmount: collectedAmount !== undefined ? (parseFloat(collectedAmount) || 0) : existing.collectedAmount,
    paymentMode: paymentMode || existing.paymentMode,
    txnId: txnId !== undefined ? txnId : existing.txnId,
    paymentDate: paymentDate || existing.paymentDate,
    notes: notes !== undefined ? notes : existing.notes,
    photo: photo !== undefined ? photo : existing.photo,
    location: location || existing.location,
    updatedAt: new Date().toISOString()
  };

  mockVisits[visitIndex] = updatedVisit;
  res.json({ message: 'Visit updated successfully', visit: updatedVisit });
});

app.delete('/api/visits/:id', authenticateToken, (req, res) => {
  const visitIndex = mockVisits.findIndex(v => v.id === req.params.id);
  if (visitIndex === -1) {
    return res.status(404).json({ error: 'Visit record not found.' });
  }

  const existing = mockVisits[visitIndex];
  if (existing.userId !== req.user.userId && existing.exec_id !== req.user.userId && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to delete this visit record.' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const visitDate = (existing.timestamp || existing.createdAt || '').split('T')[0];
  if (visitDate !== todayStr && req.user.role !== 'ADMIN') {
    return res.status(400).json({ error: 'Policy Error: Delete is ONLY permitted for today\'s logs.' });
  }

  mockVisits.splice(visitIndex, 1);
  res.json({ message: 'Visit log deleted successfully.' });
});

app.post('/api/payments/settle', authenticateToken, (req, res) => {
  const { firmName, amount, paymentMode, txnId, paymentDate, notes } = req.body;
  if (!firmName || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Firm name and positive settlement amount are required.' });
  }

  const parsedAmount = parseFloat(amount);
  const nowISO = new Date().toISOString();
  const todayStr = nowISO.split('T')[0];

  const settlementVisit = {
    id: 'settle_' + Date.now(),
    exec_id: req.user.userId,
    userId: req.user.userId,
    firmName: firmName.trim(),
    purpose: 'Payment Collection',
    product: 'Dues Settlement',
    quantity: 0,
    unit: 'N/A',
    bagIncentive: 0,
    orderValue: 0,
    collectedAmount: parsedAmount,
    paymentMode: paymentMode || 'Cash',
    txnId: txnId || `SETTLE-${Date.now().toString().slice(-6)}`,
    paymentDate: paymentDate || todayStr,
    notes: notes || `Direct ledger settlement against firm dues.`,
    location: { lat: 23.3441, lng: 85.3096 },
    status: 'VERIFIED',
    timestamp: nowISO,
    createdAt: nowISO
  };

  mockVisits.unshift(settlementVisit);
  res.json({ message: 'Payment settlement recorded successfully', receipt: settlementVisit });
});

// ==========================================
// FIRMS ONBOARDING ENDPOINTS
// ==========================================

app.get('/api/firms', authenticateToken, (req, res) => {
  res.json({ firms: mockFirms });
});

app.post('/api/firms', authenticateToken, (req, res) => {
  const { name, gstin, address, phone, contactPerson, brands_handled, prices, location, photo } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Firm / Shop name is required.' });
  }

  const firmId = 'firm_' + Date.now();
  const nowISO = new Date().toISOString();
  
  const newFirm = {
    id: firmId,
    exec_id: req.user.userId,
    name: name.trim(),
    gstin: gstin ? gstin.trim().toUpperCase() : 'URP-' + Math.floor(100000 + Math.random() * 900000),
    address: address ? address.trim() : 'General Market Area',
    phone: phone ? phone.trim() : '',
    contactPerson: contactPerson ? contactPerson.trim() : '',
    brands_handled: brands_handled || 'UltraTech, ACC, Tata Tiscon',
    prices: prices || { purchase: 320, retail: 350, wholesale: 335 },
    location: location || { lat: 23.3441, lng: 85.3096 },
    photo: photo || '',
    timestamp: nowISO,
    createdAt: nowISO
  };

  mockFirms.unshift(newFirm);
  res.json({ message: 'Firm onboarded successfully', firm: newFirm });
});

// ==========================================
// INCENTIVES & LEDGER ENDPOINTS
// ==========================================

app.get('/api/incentives/my', authenticateToken, (req, res) => {
  const userVisits = mockVisits.filter(v => v.exec_id === req.user.userId || v.userId === req.user.userId || req.user.role === 'ADMIN');
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const todayVisits = userVisits.filter(v => (v.paymentDate || v.timestamp || '').startsWith(todayStr));
  const monthVisits = userVisits.filter(v => (v.paymentDate || v.timestamp || '').startsWith(currentMonthStr));

  const totalCollectedToday = todayVisits.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const totalCollectedMonth = monthVisits.reduce((sum, v) => sum + (v.collectedAmount || 0), 0);
  const totalOrdersMonth = monthVisits.reduce((sum, v) => sum + (v.orderValue || 0), 0);
  const totalBagIncentives = userVisits.reduce((sum, v) => sum + (v.bagIncentive || 0), 0);

  const kmRate = globalConfig.kmRate || 5;
  const fooding = globalConfig.foodingAllowance || 250;

  const instrumentBreakdown = {
    cash: 0,
    googlePayUPI: 0,
    cheque: 0,
    fleetCards: 0,
    smartCards: 0,
    neft: 0,
    others: 0
  };

  userVisits.forEach(v => {
    const amt = v.collectedAmount || 0;
    if (amt <= 0) return;
    const mode = (v.paymentMode || '').toLowerCase();
    if (mode.includes('cash')) instrumentBreakdown.cash += amt;
    else if (mode.includes('google') || mode.includes('upi') || mode.includes('gpay')) instrumentBreakdown.googlePayUPI += amt;
    else if (mode.includes('cheque')) instrumentBreakdown.cheque += amt;
    else if (mode.includes('fleet')) instrumentBreakdown.fleetCards += amt;
    else if (mode.includes('smart')) instrumentBreakdown.smartCards += amt;
    else if (mode.includes('neft') || mode.includes('net') || mode.includes('bank')) instrumentBreakdown.neft += amt;
    else instrumentBreakdown.others += amt;
  });

  const firmLedgerMap = {};
  mockFirms.forEach(f => {
    firmLedgerMap[f.name] = {
      firmId: f.id,
      firmName: f.name,
      gstin: f.gstin,
      address: f.address,
      billedAmount: 0,
      totalCollected: 0,
      netBalanceDue: 0
    };
  });

  userVisits.forEach(v => {
    const name = v.firmName || 'Unknown Firm';
    if (!firmLedgerMap[name]) {
      firmLedgerMap[name] = {
        firmId: 'f_' + Math.random().toString(36).substr(2, 6),
        firmName: name,
        gstin: 'URP',
        address: 'Market Area',
        billedAmount: 0,
        totalCollected: 0,
        netBalanceDue: 0
      };
    }
    firmLedgerMap[name].billedAmount += (v.orderValue || 0);
    firmLedgerMap[name].totalCollected += (v.collectedAmount || 0);
  });

  const firmLedger = Object.values(firmLedgerMap).map(f => ({
    ...f,
    netBalanceDue: Math.max(0, f.billedAmount - f.totalCollected)
  }));

  res.json({
    summary: {
      totalCollectedToday,
      totalCollectedMonth,
      totalOrdersMonth,
      totalBagIncentives,
      dailyFoodingAllowance: fooding,
      kmRate,
      productMatrix: globalConfig.incentives || [],
      instrumentBreakdown,
      firmLedger
    }
  });
});

// ==========================================
// ADMIN CONFIG & USER MANAGEMENT ENDPOINTS
// ==========================================

app.get('/api/admin/config', authenticateToken, (req, res) => {
  res.json(globalConfig);
});

app.put('/api/admin/config', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  globalConfig = req.body;
  res.json({ config: globalConfig });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  res.json({ users: mockUsers });
});

app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const user = mockUsers.find(u => u.user_id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { fullName, full_name, phoneNumber, phone_number, email, role, supervisor, status } = req.body;
  if (fullName || full_name) user.full_name = fullName || full_name;
  if (phoneNumber || phone_number) user.phone_number = phoneNumber || phone_number;
  if (email) user.email = email;
  if (role) user.role = role;
  if (supervisor !== undefined) user.supervisor = supervisor;
  if (status) user.status = status;

  res.json({ message: 'User updated successfully', user });
});

app.put('/api/admin/users/:id/status', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const user = mockUsers.find(u => u.user_id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { status } = req.body;
  if (!['ACTIVE', 'PENDING', 'DISABLED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  user.status = status;
  res.json({ message: `User status changed to ${status}`, user });
});

app.post('/api/admin/users/:id/reset-password', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const user = mockUsers.find(u => u.user_id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters.' });
  }
  const salt = await bcrypt.genSalt(10);
  user.password_hash = await bcrypt.hash(newPassword, salt);
  res.json({ message: `Password for ${user.full_name} has been reset successfully.` });
});

// ==========================================
// ADMIN DASHBOARD & REPORTS (REAL METRICS)
// ==========================================

app.get('/api/admin/dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  
  const todayStr = new Date().toISOString().split('T')[0];
  const executives = mockUsers.filter(u => u.role !== 'ADMIN');
  const todayVisits = mockVisits.filter(v => (v.paymentDate || v.timestamp || '').startsWith(todayStr));
  const todayShifts = mockShifts.filter(s => (s.startTime || '').startsWith(todayStr));

  // Billing & Quantities by unit
  let totalBilling = 0;
  const unitMap = {};
  todayVisits.forEach(v => {
    totalBilling += (v.orderValue || 0);
    const u = v.unit || 'Bags';
    unitMap[u] = (unitMap[u] || 0) + (v.quantity || 0);
  });

  const byUnit = Object.entries(unitMap).map(([unit, quantity]) => ({ unit, quantity }));

  // Payment Collections
  let totalCollections = 0;
  const modeMap = {};
  const recentTransactions = [];

  todayVisits.forEach(v => {
    const amt = v.collectedAmount || 0;
    if (amt > 0) {
      totalCollections += amt;
      const m = v.paymentMode || 'Cash';
      if (!modeMap[m]) modeMap[m] = { amount: 0, count: 0 };
      modeMap[m].amount += amt;
      modeMap[m].count += 1;

      recentTransactions.push({
        id: v.id,
        mode: m,
        amount: amt,
        client: v.firmName,
        time: new Date(v.timestamp || v.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
  });

  const byMode = Object.entries(modeMap).map(([mode, data]) => ({
    mode,
    amount: data.amount,
    count: data.count
  }));

  // Executive Activity
  const execActivity = executives.map(u => {
    const activeShift = mockShifts.find(s => s.userId === u.user_id && s.status === 'ACTIVE');
    const uVisitsToday = todayVisits.filter(v => v.userId === u.user_id || v.exec_id === u.user_id);
    return {
      id: u.user_id,
      name: u.full_name,
      status: activeShift ? 'Active' : 'Off Duty',
      startOdometer: activeShift ? `${activeShift.openingOdometer}` : '-',
      totalVisitsToday: uVisitsToday.length
    };
  });

  const activeCount = execActivity.filter(e => e.status === 'Active').length;
  const totalFieldKmsToday = todayShifts.reduce((sum, s) => sum + (s.totalKms || 0), 0);

  const liveLocation = execActivity.filter(e => e.status === 'Active').map(e => {
    const lastVisit = todayVisits.find(v => v.userId === e.id);
    return {
      id: e.id,
      name: e.name,
      lat: lastVisit?.location?.lat || 23.3441,
      lng: lastVisit?.location?.lng || 85.3096,
      lastUpdated: new Date().toLocaleTimeString()
    };
  });

  const stops = todayVisits.slice(0, 8).map((v, idx) => ({
    id: idx + 1,
    time: new Date(v.timestamp || v.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    name: v.firmName,
    lat: v.location?.lat || 23.3441,
    lng: v.location?.lng || 85.3096
  }));

  const routeHistory = {
    date: new Date().toLocaleDateString(),
    totalShiftKms: totalFieldKmsToday,
    stops
  };

  res.json({
    kpis: {
      activeExecutives: activeCount,
      totalFieldKmsToday,
      totalVisitsToday: todayVisits.length,
      pendingVerifications: 0
    },
    activity: execActivity,
    salesReport: {
      totalBilling,
      byUnit
    },
    paymentReport: {
      totalCollections,
      byMode,
      recentTransactions: recentTransactions.slice(0, 10)
    },
    liveLocation,
    routeHistory
  });
});

app.get('/api/admin/reports', authenticateToken, (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

  const { range = 'daily', startDate, endDate, executiveId = 'all' } = req.query;
  const todayStr = new Date().toISOString().split('T')[0];

  let filteredVisits = [...mockVisits];
  if (executiveId !== 'all') {
    filteredVisits = filteredVisits.filter(v => v.exec_id === executiveId || v.userId === executiveId);
  }
  if (startDate && endDate) {
    filteredVisits = filteredVisits.filter(v => {
      const vDate = (v.paymentDate || v.timestamp || '').split('T')[0];
      return vDate >= startDate && vDate <= endDate;
    });
  }

  // 1. Sales by Product
  const productMap = {};
  let totalSalesValue = 0;
  let totalVolumeUnits = 0;

  filteredVisits.forEach(v => {
    if ((v.orderValue || 0) > 0 || (v.quantity || 0) > 0) {
      const prodName = v.product || 'General Materials';
      if (!productMap[prodName]) {
        productMap[prodName] = {
          productName: prodName,
          unit: v.unit || 'Bags',
          quantity: 0,
          totalSalesValue: 0
        };
      }
      productMap[prodName].quantity += (v.quantity || 0);
      productMap[prodName].totalSalesValue += (v.orderValue || 0);
      totalSalesValue += (v.orderValue || 0);
      totalVolumeUnits += (v.quantity || 0);
    }
  });

  const salesByProduct = Object.values(productMap).map((p, idx) => ({
    id: `p-${idx + 1}`,
    ...p,
    unitPrice: p.quantity > 0 ? Math.round(p.totalSalesValue / p.quantity) : 0
  }));

  // 2. Collections by Mode
  let totalCollections = 0;
  const modeMap = {};
  const transactions = [];

  filteredVisits.forEach(v => {
    const amt = v.collectedAmount || 0;
    if (amt > 0) {
      totalCollections += amt;
      const m = v.paymentMode || 'Cash';
      if (!modeMap[m]) modeMap[m] = { count: 0, amount: 0 };
      modeMap[m].count += 1;
      modeMap[m].amount += amt;

      const exec = mockUsers.find(u => u.user_id === (v.exec_id || v.userId));
      transactions.push({
        id: v.txnId || `TXN-${v.id}`,
        dateTime: new Date(v.timestamp || v.createdAt || Date.now()).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        rawDate: (v.paymentDate || v.timestamp || '').split('T')[0],
        execName: exec ? exec.full_name : 'Field Executive',
        execId: v.exec_id || v.userId,
        clientName: v.firmName,
        mode: m,
        refNumber: v.txnId || 'REF-DIRECT',
        amount: amt,
        status: 'Settled'
      });
    }
  });

  const collectionsByMode = Object.entries(modeMap).map(([mode, data]) => ({
    mode,
    count: data.count,
    amount: data.amount,
    percentage: totalCollections > 0 ? ((data.amount / totalCollections) * 100).toFixed(1) : '0'
  }));

  // 3. Reimbursements
  const kmRate = globalConfig.kmRate || 5;
  const foodingRate = globalConfig.foodingAllowance || 250;
  const execUsers = mockUsers.filter(u => u.role !== 'ADMIN');
  const targetExecs = executiveId === 'all' ? execUsers : execUsers.filter(u => u.user_id === executiveId);

  let filteredShifts = [...mockShifts];
  if (executiveId !== 'all') {
    filteredShifts = filteredShifts.filter(s => s.userId === executiveId);
  }
  if (startDate && endDate) {
    filteredShifts = filteredShifts.filter(s => {
      const sDate = (s.startTime || '').split('T')[0];
      return sDate >= startDate && sDate <= endDate;
    });
  }

  const reimbursementsByExec = targetExecs.map(exec => {
    const userShifts = filteredShifts.filter(s => s.userId === exec.user_id);
    const kms = parseFloat(userShifts.reduce((sum, s) => sum + (s.totalKms || 0), 0).toFixed(1));
    const kmPayout = Math.round(kms * kmRate);
    const fooding = userShifts.length * foodingRate;
    const misc = 0;
    const netSettled = kmPayout + fooding + misc;

    return {
      execId: exec.user_id,
      execName: exec.full_name,
      kms,
      kmRate,
      kmPayout,
      foodingAllowance: fooding,
      miscExpenses: misc,
      netSettled,
      status: 'Approved & Settled'
    };
  });

  const totalKmTravelled = parseFloat(reimbursementsByExec.reduce((acc, r) => acc + r.kms, 0).toFixed(1));
  const totalKmPayout = reimbursementsByExec.reduce((acc, r) => acc + r.kmPayout, 0);
  const totalFoodingAllowance = reimbursementsByExec.reduce((acc, r) => acc + r.foodingAllowance, 0);
  const totalMiscExpenses = reimbursementsByExec.reduce((acc, r) => acc + r.miscExpenses, 0);
  const netSettledAmount = reimbursementsByExec.reduce((acc, r) => acc + r.netSettled, 0);

  // 4. Visit Performance
  const totalVisitsCount = filteredVisits.length;
  const verifiedCount = totalVisitsCount;
  const rejectedCount = 0;
  const pendingCount = 0;
  const rejectionRate = '0.0%';

  const visitPerformanceByExec = targetExecs.map(exec => {
    const uVisits = filteredVisits.filter(v => v.exec_id === exec.user_id || v.userId === exec.user_id);
    return {
      execId: exec.user_id,
      execName: exec.full_name,
      totalVisits: uVisits.length,
      verified: uVisits.length,
      rejected: 0,
      pending: 0,
      rejectionRate: '0.0%'
    };
  });

  res.json({
    filters: {
      range,
      startDate: startDate || todayStr,
      endDate: endDate || todayStr,
      executiveId
    },
    executives: execUsers.map(u => ({ id: u.user_id, name: u.full_name })),
    kpis: {
      totalSalesValue,
      totalVolumeUnits,
      totalCollections,
      totalKmTravelled,
      netSettledAmount,
      totalVisitsCount,
      verifiedCount,
      rejectedCount,
      rejectionRate
    },
    salesSummary: {
      totalSalesValue,
      totalVolumeUnits,
      byProduct: salesByProduct
    },
    collectionsSummary: {
      totalCollections,
      byMode: collectionsByMode,
      transactions
    },
    reimbursementsSummary: {
      kmRate,
      totalKmTravelled,
      totalKmPayout,
      totalFoodingAllowance,
      totalMiscExpenses,
      netSettledAmount,
      byExecutive: reimbursementsByExec
    },
    visitPerformance: {
      totalVisits: totalVisitsCount,
      verifiedCount,
      rejectedCount,
      pendingCount,
      rejectionRate,
      byExecutive: visitPerformanceByExec
    }
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
    console.log(`🚀 SMM Portal running on port ${PORT}`);
  });
}
startServer();
