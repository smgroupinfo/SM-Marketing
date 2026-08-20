const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. Update globalConfig to use array of objects for incentives
code = code.replace(/let globalConfig = \{[\s\S]*?incentives: \{[\s\S]*?\}[\s\S]*?\};/, `let globalConfig = {
  kmRate: 5,
  foodingAllowance: 250,
  incentives: [
    { id: '1', name: 'Cement', unit: 'Bags', rate: 10 },
    { id: '2', name: 'Steel', unit: 'MT', rate: 50 },
    { id: '3', name: 'Pipes', unit: 'Pcs', rate: 10 }
  ]
};`);

// 2. Update Admin User Seed to have status='ACTIVE'
code = code.replace(/role: 'ADMIN'\n\s+\}\);/, `role: 'ADMIN',\n    status: 'ACTIVE',\n    supervisor: ''\n  });`);

// 3. Update newUser in mock DB insertion to default status='PENDING'
code = code.replace(/role: params\[5\]\n\s+\};/, `role: params[5],\n          status: 'PENDING',\n          supervisor: ''\n        };`);

// 4. Update auth/login to check status
const loginRegex = /if \(!isMatch\) \{\n\s+return res.status\(401\).json\(\{ error: 'Invalid credentials.' \}\);\n\s+\}/;
code = code.replace(loginRegex, `if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    
    if (user.role !== 'ADMIN' && user.status === 'PENDING') {
      return res.status(403).json({ error: 'Account pending admin approval.' });
    }
    if (user.role !== 'ADMIN' && user.status === 'DISABLED') {
      return res.status(403).json({ error: 'Account disabled.' });
    }`);
    
// 5. Add new admin endpoints to server.js
const adminEndpointsIndex = code.indexOf("app.get('/api/admin/config'");
const newEndpoints = `
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

// We need to inject mock data for Sales, Payments, and Location into the dashboard API.
`;
code = code.substring(0, adminEndpointsIndex) + newEndpoints + code.substring(adminEndpointsIndex);

// 6. Update Admin Dashboard Mock Data
const dashReturnRegex = /res.json\(\{[\s\S]*?kpis: \{[\s\S]*?\},[\s\S]*?activity: execActivity[\s\S]*?\}\);/;

const enhancedDashReturn = `
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

  const liveLocation = execActivity.filter(e => e.status === 'Active').map((e, idx) => ({
    id: e.id,
    name: e.name,
    lat: 12.9716 + (Math.random() * 0.05 * (idx % 2 === 0 ? 1 : -1)),
    lng: 77.5946 + (Math.random() * 0.05 * (idx % 2 === 0 ? 1 : -1)),
    lastUpdated: new Date().toLocaleTimeString()
  }));

  const routeHistory = {
    date: today,
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
      activeExecutives: activeShifts.length || execActivity.filter(e => e.status === 'Active').length,
      totalFieldKmsToday,
      totalVisitsToday: todayVisits.length || execActivity.reduce((sum, e) => sum + e.totalVisitsToday, 0),
      pendingVerifications
    },
    activity: execActivity,
    salesReport,
    paymentReport,
    liveLocation,
    routeHistory
  });
`;

code = code.replace(dashReturnRegex, enhancedDashReturn);

fs.writeFileSync('server.js', code);
