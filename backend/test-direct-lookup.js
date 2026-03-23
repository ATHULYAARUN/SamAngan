const mongoose = require('mongoose');
const PregnantWoman = require('./models/PregnantWoman');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(async () => {
  try {
    const userId = '697c5a7c1267e908ec478460';
    console.log('🔍 Testing direct model lookup...');
    
    // Test by userId
    const womanByUserId = await PregnantWoman.findOne({ userId: userId });
    console.log('📊 Found by userId:', womanByUserId ? 'YES' : 'NO');
    if (womanByUserId) {
      console.log('📋 Woman details:', { name: womanByUserId.name, id: womanByUserId._id, userId: womanByUserId.userId });
    }
    
    // Test by direct ID
    const womanById = await PregnantWoman.findById(userId);
    console.log('📊 Found by direct ID:', womanById ? 'YES' : 'NO');
    if (womanById) {
      console.log('📋 Woman details:', { name: womanById.name, id: womanById._id, userId: womanById.userId });
    }
    
    // Show all records
    const allWomen = await PregnantWoman.find({});
    console.log('\n📋 All PregnantWoman records:');
    allWomen.forEach(woman => {
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
