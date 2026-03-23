const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/anganwadi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addPregnantWomanRecordsDirectly = async () => {
  try {
    console.log('🔧 Adding PregnantWoman records directly to database...');
    
    // Test users data
    const testUsers = [
      {
        name: 'Rshmi',
        email: 'rshmi@test.com',
        dateOfBirth: '1998-05-15',
        lastMenstrualPeriod: '2025-09-15',
        expectedDeliveryDate: '2026-06-22',
        bloodGroup: 'B+',
        height: 158,
        currentWeight: 62,
        husbandName: 'Arun Kumar',
        husbandPhone: '+919876543211'
      },
      {
        name: 'Revathy',
        email: 'revathy@test.com',
        dateOfBirth: '1997-08-22',
        lastMenstrualPeriod: '2025-09-01',
        expectedDeliveryDate: '2026-06-08',
        bloodGroup: 'O+',
        height: 165,
        currentWeight: 68,
        husbandName: 'Mohan Kumar',
        husbandPhone: '+919876543213'
      }
    ];
    
    for (const userData of testUsers) {
      console.log(`\n📝 Processing user: ${userData.name}`);
      
      // Find the user
      const user = await User.findOne({ email: userData.email });
      if (!user) {
        console.log(`❌ User ${userData.name} not found, skipping...`);
        continue;
      }
      
      // Create PregnantWoman record using raw MongoDB insert
      const db = mongoose.connection.db;
      const pregnantWomenCollection = db.collection('pregnantwomen');
      
      const pregnantWomanData = {
        name: userData.name,
        dateOfBirth: new Date(userData.dateOfBirth),
        phone: user.phone,
        email: userData.email,
        husbandName: userData.husbandName,
        husbandPhone: userData.husbandPhone,
        lmp: new Date(userData.lastMenstrualPeriod),
        edd: new Date(userData.expectedDeliveryDate),
        pregnancyNumber: 1,
        bloodGroup: userData.bloodGroup,
        height: userData.height,
        prePregnancyWeight: userData.currentWeight - 2,
        currentWeight: userData.currentWeight,
        medicalHistory: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          kidneyDisease: false,
          thyroidDisorder: false,
          anemia: false,
          allergies: [],
          medications: [],
          previousComplications: []
        },
        address: {
          street: '123 Main Street',
          village: 'Demo Village',
          block: 'Demo Block',
          district: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        anganwadiCenter: 'Demo Anganwadi Center',
        registeredBy: user._id,
        specialNeeds: '',
        userId: user._id,
        registrationDate: new Date(),
        status: 'active',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await pregnantWomenCollection.insertOne(pregnantWomanData);
      console.log(`✅ PregnantWoman record created: ${userData.name} (ID: ${result.insertedId})`);
    }
    
    console.log('\n🎉 PregnantWoman records added successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Rshmi: rshmi@test.com / password123');
    console.log('Revathy: revathy@test.com / password123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addPregnantWomanRecordsDirectly();
