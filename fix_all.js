const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Just remove all backslashes before backticks and dollar signs
code = code.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('src/App.jsx', code);
