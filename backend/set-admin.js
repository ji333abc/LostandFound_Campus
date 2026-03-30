const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: process.env.ENV_FILE || path.resolve(__dirname, '.env') });

function printUsage() {
  console.log('用法：');
  console.log('  node set-admin.js <username>');
  console.log('  node set-admin.js <username> admin');
  console.log('  node set-admin.js <username> user');
  console.log('');
  console.log('可选环境变量：');
  console.log('  ENV_FILE=.env.local');
}

async function main() {
  const [, , username, roleArg] = process.argv;
  const role = roleArg || 'admin';

  if (!username) {
    console.error('❌ 缺少用户名');
    printUsage();
    process.exit(1);
  }

  if (!['admin', 'user'].includes(role)) {
    console.error(`❌ 非法角色：${role}`);
    printUsage();
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_lost_found';

  try {
    await mongoose.connect(mongoUri);

    const user = await User.findOneAndUpdate(
      { username },
      { role },
      { new: true }
    ).select('username role studentId college phone createdAt');

    if (!user) {
      console.error(`❌ 未找到用户：${username}`);
      process.exit(1);
    }

    console.log('✅ 用户角色更新成功');
    console.log(user);
    process.exit(0);
  } catch (err) {
    console.error('❌ 更新失败：', err.message);
    process.exit(1);
  }
}

main();