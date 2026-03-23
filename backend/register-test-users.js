const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const PregnantWoman = require('./models/PregnantWoman');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/anganwadi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const registerTestUsers = async () => {
  try {
    console.log('🔧 Registering test pregnant women users...');
    
    // Test users data
    const testUsers = [
      {
        name: 'Rshmi',
        email: 'rshmi@test.com',
        password: 'password123',
        phone: '+919876543210',
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
        password: 'password123',
        phone: '+919876543212',
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
      console.log(`\n📝 Registering user: ${userData.name}`);
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`⚠️  User ${userData.name} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create User record
      const user = new User({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'pregnant-woman',
        hashedPassword,
        address: {
          city: 'Bangalore',
          state: 'Karnataka'
        },
        roleSpecificData: {
          pregnantWomanDetails: {
            husbandName: userData.husbandName,
            husbandPhone: userData.husbandPhone,
            lastMenstrualPeriod: userData.lastMenstrualPeriod,
            expectedDeliveryDate: userData.expectedDeliveryDate,
            pregnancyNumber: 1,
            bloodGroup: userData.bloodGroup,
            height: userData.height,
            currentWeight: userData.currentWeight,
            prePregnancyWeight: userData.currentWeight - 2,
            medicalHistory: {},
            anganwadiCenter: 'Demo Center',
            specialNeeds: ''
          }
        }
      });
      
      await user.save();
      console.log(`✅ User created: ${user.name} (ID: ${user._id})`);
      
      // Create PregnantWoman record
      console.log('Creating PregnantWoman with data:', {
        lmp: userData.lastMenstrualPeriod,
        edd: userData.expectedDeliveryDate,
        lmpDate: new Date(userData.lastMenstrualPeriod),
        eddDate: new Date(userData.expectedDeliveryDate)
      });
      
      const pregnantWoman = new PregnantWoman({
        name: userData.name,
        dateOfBirth: new Date(userData.dateOfBirth),
        phone: userData.phone,
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
        medicalHistory: {},
        address: {
          street: '123 Main Street',
          village: 'Demo Village',
          block: 'Demo Block',
          district: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001'
        },
        anganwadiCenter: 'Demo Anganwadi Center',
        registeredBy: user._id, // Self-registration
        specialNeeds: '',
        userId: user._id
      });
      
      await pregnantWoman.save();
      console.log(`✅ PregnantWoman record created: ${pregnantWoman.name} (ID: ${pregnantWoman._id})`);
    }
    
    console.log('\n🎉 Test users registered successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Rshmi: rshmi@test.com / password123');
    console.log('Revathy: revathy@test.com / password123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

registerTestUsers();
