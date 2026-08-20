const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// The file got injected multiple times probably because I used both a regex replace and a substring replacement.
// Let's just find the first instance of function AdminUMS and the end of AdminDashboard, and remove the duplicated block.
// Let's manually strip it. We'll search for the *second* AdminUMS and remove it along with the rest of the file until ProfileSettings.

const firstUMS = code.indexOf('function AdminUMS({ user }) {');
const secondUMS = code.indexOf('function AdminUMS({ user }) {', firstUMS + 1);

if (secondUMS !== -1) {
  const profileSettingsIdx = code.indexOf('function ProfileSettings({ user, onLogout }) {', secondUMS);
  code = code.substring(0, secondUMS) + code.substring(profileSettingsIdx);
  fs.writeFileSync('src/App.jsx', code);
}
