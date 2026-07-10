const path = require('path');
const fs = require('fs');

// Load .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let value = trimmed.slice(eqIdx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    }
  }
}

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
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri, { dbName: 'DelaHarme' });
  const db = mongoose.connection.db;

  console.log('Connected to MongoDB. Seeding data...\n');

  // ── 1. Create test agent ──────────────────────────────────────────
  const agentHash = await hashPassword('AgentPass@123');
  let agent = await db.collection('users').findOne({ email: 'agent@test.com' });
  if (!agent) {
    const result = await db.collection('users').insertOne({
      username: 'Test Agent',
      email: 'agent@test.com',
      passwordHash: agentHash,
      role: 'agent',
      status: 'Approved',
      rejectionReason: '',
      onboardingComplete: true,
      fullName: 'Abdi Mohammed',
      ethPhone: '+251911223344',
      profilePhoto: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });
    agent = { _id: result.insertedId };
    console.log('Created test agent: agent@test.com / AgentPass@123');
  } else {
    console.log('Test agent already exists: agent@test.com');
  }

  // ── 2. Create test properties ─────────────────────────────────────
  const propertiesData = [
    {
      title: '3-Bedroom House in Bole, Addis Ababa',
      type: 'House',
      listingType: 'For Sale',
      price: 15000000,
      priceType: 'Negotiable',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: '03',
      kebele: '05',
      parcel: '102',
      block: '5',
      homeNo: '450',
      area: 250,
      bedrooms: 3,
      bathrooms: 2,
      condition: 'Finished',
      legalizedYear: 2022,
      description: 'Beautiful modern house in Bole area with garden and parking. Close to amenities and main roads.',
      features: ['Parking', 'Garden', 'Security', 'Water Tank'],
      images: [
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/house1_a.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/house1_b.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/house1_c.jpg',
      ],
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      latitude: 9.0054,
      longitude: 38.7636,
      locationDocument: '',
      status: 'Approved',
      agentId: agent._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    },
    {
      title: 'Luxury Apartment in Kazanchis',
      type: 'Apartment',
      listingType: 'For Rent',
      price: 45000,
      priceType: 'per month',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      subCity: 'Kirkos',
      woreda: '09',
      kebele: '12',
      parcel: '203',
      block: '8',
      homeNo: '120',
      area: 120,
      bedrooms: 2,
      bathrooms: 1,
      condition: 'Finished',
      legalizedYear: 2023,
      description: 'Modern apartment in central Kazanchis with great views. Fully furnished with modern appliances.',
      features: ['Furnished', 'Elevator', 'Parking', 'Gym'],
      images: [
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/apt1_a.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/apt1_b.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/apt1_c.jpg',
      ],
      videoUrl: '',
      latitude: 9.0128,
      longitude: 38.7683,
      locationDocument: '',
      status: 'Approved',
      agentId: agent._id,
      createdAt: new Date(Date.now() - 3600000),
      updatedAt: new Date(Date.now() - 3600000),
      __v: 0,
    },
    {
      title: 'Vacant Land in Sululta',
      type: 'Land',
      listingType: 'For Sale',
      price: 5000000,
      priceType: 'Fixed Price',
      region: 'Addis Ababa',
      city: 'Addis Ababa',
      subCity: 'Sululta',
      woreda: '01',
      kebele: '08',
      parcel: '55',
      block: '2',
      homeNo: '',
      area: 500,
      bedrooms: 0,
      bathrooms: 0,
      condition: 'Finished',
      legalizedYear: 2024,
      description: 'Prime land in Sululta with road access. Ideal for residential development.',
      features: ['Road Access', 'Electricity', 'Water Supply'],
      images: [
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/land1_a.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/land1_b.jpg',
        'https://res.cloudinary.com/y7q39zm5/image/upload/v1783685710/delaharme/properties/land1_c.jpg',
      ],
      videoUrl: '',
      latitude: 9.0833,
      longitude: 38.7333,
      locationDocument: '',
      status: 'Approved',
      agentId: agent._id,
      createdAt: new Date(Date.now() - 7200000),
      updatedAt: new Date(Date.now() - 7200000),
      __v: 0,
    },
  ];

  const propertyIds = [];
  for (const prop of propertiesData) {
    let existing = await db.collection('properties').findOne({ title: prop.title });
    if (!existing) {
      const result = await db.collection('properties').insertOne(prop);
      propertyIds.push(result.insertedId);
      console.log(`Created property: ${prop.title}`);
    } else {
      propertyIds.push(existing._id);
      console.log(`Property exists: ${prop.title}`);
    }
  }

  // ── 3. Create test messages ───────────────────────────────────────
  const messagesData = [
    // Conversation 1: Almaz interested in Bole house
    {
      propertyId: propertyIds[0],
      agentId: agent._id,
      buyerName: 'Almaz Kassa',
      buyerEmail: 'almaz@gmail.com',
      buyerPhone: '+251922334455',
      sender: 'buyer',
      text: 'Hello, I am interested in the Bole house. Is it still available?',
      read: true,
      createdAt: new Date(Date.now() - 7200000),
    },
    {
      propertyId: propertyIds[0],
      agentId: agent._id,
      buyerName: 'Almaz Kassa',
      buyerEmail: 'almaz@gmail.com',
      buyerPhone: '+251922334455',
      sender: 'agent',
      text: 'Hi Almaz, thank you for reaching out. Yes, the house is still available. Would you like to schedule a visit?',
      read: true,
      createdAt: new Date(Date.now() - 6800000),
    },
    {
      propertyId: propertyIds[0],
      agentId: agent._id,
      buyerName: 'Almaz Kassa',
      buyerEmail: 'almaz@gmail.com',
      buyerPhone: '+251922334455',
      sender: 'buyer',
      text: 'Yes, that would be great. Also, is the price negotiable?',
      read: false,
      createdAt: new Date(Date.now() - 3600000),
    },

    // Conversation 2: Bekele interested in Kazanchis apartment
    {
      propertyId: propertyIds[1],
      agentId: agent._id,
      buyerName: 'Bekele Shiferaw',
      buyerEmail: 'bekele@gmail.com',
      buyerPhone: '+251933445566',
      sender: 'buyer',
      text: 'Hi, I saw the apartment listing. Can we visit this weekend?',
      read: true,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      propertyId: propertyIds[1],
      agentId: agent._id,
      buyerName: 'Bekele Shiferaw',
      buyerEmail: 'bekele@gmail.com',
      buyerPhone: '+251933445566',
      sender: 'agent',
      text: 'Hello Bekele. Sure, you can visit on Saturday afternoon. I will meet you there.',
      read: true,
      createdAt: new Date(Date.now() - 82800000),
    },
  ];

  let msgCount = 0;
  for (const msg of messagesData) {
    const existing = await db.collection('messages').findOne({
      propertyId: msg.propertyId,
      buyerEmail: msg.buyerEmail,
      text: msg.text,
    });
    if (!existing) {
      await db.collection('messages').insertOne({ ...msg, updatedAt: msg.createdAt });
      msgCount++;
    }
  }
  console.log(`Created ${msgCount} test messages`);

  // ── 4. Summary ────────────────────────────────────────────────────
  const users = await db.collection('users').find({}).project({ email: 1, role: 1, status: 1 }).toArray();
  const props = await db.collection('properties').find({}).project({ title: 1, status: 1, agentId: 1 }).toArray();
  const msgs = await db.collection('messages').find({}).project({ buyerName: 1, sender: 1, text: 1 }).toArray();

  console.log('\n=== SEED SUMMARY ===');
  console.log('\nUsers:');
  users.forEach(u => console.log(`  ${u.email} | ${u.role} | ${u.status}`));
  console.log(`\nProperties (${props.length}):`);
  props.forEach(p => console.log(`  ${p.title} | ${p.status}`));
  console.log(`\nMessages (${msgs.length}):`);
  msgs.forEach(m => console.log(`  [${m.sender}] ${m.buyerName}: ${m.text}`));

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch(console.error);
