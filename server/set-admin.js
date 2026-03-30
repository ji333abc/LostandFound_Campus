const mongoose = require('mongoose');
const User = require('./models/User');

mongoose
  .connect('mongodb://localhost:27017/campus_lost_found')
  .then(async () => {
    const username = 'test';
    const user = await User.findOneAndUpdate(
      { username },
      { role: 'admin' },
      { new: true }
    );
    console.log('Updated user:', user);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });