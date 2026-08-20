const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(/config\.headers\['Authorization'\] = \\\`Bearer \\\$\\{token\\}\\\`;/g, "config.headers['Authorization'] = `Bearer ${token}`;");

code = code.replace(/await api\.put\(\\\`\/admin\/users\/\\\$\\{editUser\.user_id\\}\/approve\\\`, editForm\);/g, "await api.put(`/admin/users/${editUser.user_id}/approve`, editForm);");

code = code.replace(/className=\{\\\`(.*?)\\\`\}/g, "className={`$1`}");
code = code.replace(/<p className="text-xs text-gray-500 font-medium mt-1">\{isAdmin \? 'Sundaram Mahadeo Group' : \\\`\\\$\\{user\.fullName\\} • Field Exec\\\`\}<\/p>/g, "<p className=\"text-xs text-gray-500 font-medium mt-1\">{isAdmin ? 'Sundaram Mahadeo Group' : `${user.fullName} • Field Exec`}</p>");

fs.writeFileSync('src/App.jsx', code);
