const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: __dirname + '/.env' });

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}, 'email name googleId authProvider');
    console.log("ALL USERS IN DB:");
    users.forEach(u => console.log(`- ID: ${u._id}, Email: ${u.email}, GoogleID: ${u.googleId}`));
    
    // Check for duplicate emails
    const emails = users.map(u => u.email);
    const duplicates = emails.filter((item, index) => emails.indexOf(item) !== index);
    console.log("\nDuplicate emails found:", duplicates);
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkUsers();
