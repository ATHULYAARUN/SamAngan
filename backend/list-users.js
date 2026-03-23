const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/anganwadi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const listAllUsers = async () => {
  try {
    console.log('🔍 Finding all users...');
    
    // Find all users
    const allUsers = await User.find({});
    console.log(`Found ${allUsers.length} users in database:`);
    
    for (const user of allUsers) {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    }
    
    // Find specifically Rshmi and Revathy
    const rshmi = await User.findOne({ name: /rshmi/i });
    const revathy = await User.findOne({ name: /revathy/i });
    
    console.log('\n🔍 Specific search results:');
    console.log(`Rshmi found: ${rshmi ? 'YES' : 'NO'}`);
    if (rshmi) {
      console.log(`  - ID: ${rshmi._id}`);
      console.log(`  - Email: ${rshmi.email}`);
      console.log(`  - Role: ${rshmi.role}`);
    }
    
    console.log(`Revathy found: ${revathy ? 'YES' : 'NO'}`);
    if (revathy) {
      console.log(`  - ID: ${revathy._id}`);
      console.log(`  - Email: ${revathy.email}`);
      console.log(`  - Role: ${revathy.role}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

listAllUsers();
