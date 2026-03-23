const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(() => {
  const db = mongoose.connection.db;
  
  db.listCollections().toArray().then(collections => {
    console.log('📋 All collections in database:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});
