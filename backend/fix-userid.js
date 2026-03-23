const mongoose = require('mongoose');
const User = require('./models/User');
const PregnantWoman = require('./models/PregnantWoman');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(async () => {
  try {
    console.log('🔧 Fixing PregnantWoman userId fields...');
    
    // Find users
    const rshmi = await User.findOne({ email: 'rshmi@test.com' });
    const revathy = await User.findOne({ email: 'revathy@test.com' });
    
    if (!rshmi || !revathy) {
      console.log('❌ Users not found');
      process.exit(1);
    }
    
    console.log(`📋 Found users: Rshmi (${rshmi._id}), Revathy (${revathy._id})`);
    
    // Update PregnantWoman records
    await PregnantWoman.updateOne(
      { name: 'Rshmi' },
      { $set: { userId: rshmi._id } }
    );
    
    await PregnantWoman.updateOne(
      { name: 'Revathy' },
      { $set: { userId: revathy._id } }
    );
    
    console.log('✅ Updated PregnantWoman records with userId');
    
    // Verify the updates
    const women = await PregnantWoman.find({});
    console.log('\n📋 Updated PregnantWoman records:');
    women.forEach(woman => {
      console.log(`- ${woman.name}: ID=${woman._id}, userId=${woman.userId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
