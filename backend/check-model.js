const mongoose = require('mongoose');
const PregnantWoman = require('./models/PregnantWoman');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(async () => {
  try {
    const women = await PregnantWoman.find({});
    console.log('📋 PregnantWoman records found via model:', women.length);
    women.forEach(woman => {
      console.log(`- ${woman.name}: ID=${woman._id}, userId=${woman.userId}`);
    });
    
    // Also try direct collection access
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('\n📋 All collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
