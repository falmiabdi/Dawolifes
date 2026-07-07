const mongoose = require('mongoose');
const { randomBytes, scrypt } = require('crypto');

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    scrypt(password, salt, 64, (error, derived) => {
      if (error) { reject(error); return; }
      resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

async function run() {
  const uri = "mongodb+srv://falmiabdi2026:bFWrg8KsSjJD6IeJkk@cluster0.ubsrjcn.mongodb.net/DelaHarme";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // Remove any existing entry with this email to avoid duplicates
  await db.collection('users').deleteMany({ email: 'felmitesfaye@gmail.com' });

  const hash = await hashPassword('SecurePass@12345');
  await db.collection('users').insertOne({
    username: 'DelaHarme Admin',
    email: 'felmitesfaye@gmail.com',
    passwordHash: hash,
    role: 'admin',
    status: 'Approved',
    rejectionReason: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  });

  console.log('Admin user inserted successfully!');
  
  const users = await db.collection('users').find({}).toArray();
  console.log('All users in DB:', users.map(u => ({ email: u.email, role: u.role, status: u.status })));
  
  await mongoose.disconnect();
}
run().catch(console.error);
