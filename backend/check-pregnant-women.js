const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/anganwadi').then(() => {
  const db = mongoose.connection.db;
  const pregnantWomenCollection = db.collection('pregnantwomen');

  pregnantWomenCollection.find({}).toArray().then(women => {
    console.log('📋 All PregnantWoman records:');
    women.forEach(woman => {
      console.log(`- ${woman.name}: ID=${woman._id}, userId=${woman.userId}, LMP=${woman.lmp}, EDD=${woman.edd}`);
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
