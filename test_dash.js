const axios = require('axios');

async function test() {
  try {
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      emailOrPhone: 'admin@test.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    
    const dashRes = await axios.get('http://localhost:3000/api/admin/dashboard', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log("Dashboard:", JSON.stringify(dashRes.data, null, 2));

    const configRes = await axios.get('http://localhost:3000/api/admin/config', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log("Config:", JSON.stringify(configRes.data, null, 2));

    const usersRes = await axios.get('http://localhost:3000/api/admin/users', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log("Users:", JSON.stringify(usersRes.data, null, 2));
  } catch(err) {
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
