const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27087/anganwadi');

User.find({email: {$in: ['rshmi@test.com', 'revathy@test.com']}}).then(users => {
  users.forEach(user => console.log(`${user.name}: ${user._id}`));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
