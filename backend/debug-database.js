const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(async () => {
  try {
    const db = mongoose.connection.db;
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📋 All collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // Check pregnantwomen collection directly
    const pregnantWomenCollection = db.collection('pregnantwomen');
    const allRecords = await pregnantWomenCollection.find({}).toArray();
    console.log('\n📋 All records in pregnantwomen collection:');
    allRecords.forEach(record => {
      console.log(`- ${record.name}: ID=${record._id}, userId=${record.userId}`);
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
