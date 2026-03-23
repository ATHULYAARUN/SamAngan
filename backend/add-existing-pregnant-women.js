const mongoose = require('mongoose');
const User = require('./models/User');
const PregnantWoman = require('./models/PregnantWoman');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/anganwadi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addExistingPregnantWomen = async () => {
  try {
    console.log('🔍 Finding existing pregnant women users...');
    
    // Find users with pregnant-woman role
    const pregnantUsers = await User.find({ role: 'pregnant-woman' });
    console.log(`Found ${pregnantUsers.length} pregnant women users`);
    
    for (const user of pregnantUsers) {
      console.log(`Processing user: ${user.name} (${user.email})`);
      
      // Check if PregnantWoman record already exists
      const existingWoman = await PregnantWoman.findOne({ userId: user._id });
      if (existingWoman) {
        console.log(`✅ PregnantWoman record already exists for ${user.name}`);
        continue;
      }
      
      // Get pregnancy details from user data
      const pregnancyDetails = user.roleSpecificData?.pregnantWomanDetails || {};
      
      // Create PregnantWoman record
      const pregnantWomanData = {
        name: user.name,
        dateOfBirth: new Date('2000-01-01'), // Default DOB if not available
        phone: user.phone,
        email: user.email,
        husbandName: pregnancyDetails.husbandName || '',
        husbandPhone: pregnancyDetails.husbandPhone || '',
        lmp: pregnancyDetails.lastMenstrualPeriod ? new Date(pregnancyDetails.lastMenstrualPeriod) : new Date('2024-09-01'),
        edd: pregnancyDetails.expectedDeliveryDate ? new Date(pregnancyDetails.expectedDeliveryDate) : new Date('2025-06-08'),
        pregnancyNumber: pregnancyDetails.pregnancyNumber || 1,
        bloodGroup: pregnancyDetails.bloodGroup || 'O+',
        height: pregnancyDetails.height || 160,
        prePregnancyWeight: pregnancyDetails.prePregnancyWeight || 60,
        currentWeight: pregnancyDetails.currentWeight || pregnancyDetails.weight || 65,
        medicalHistory: pregnancyDetails.medicalHistory || {},
        address: user.address || {},
        assignedCenter: pregnancyDetails.anganwadiCenter || '',
        specialNeeds: pregnancyDetails.specialNeeds || '',
        userId: user._id
      };
      
      const pregnantWoman = new PregnantWoman(pregnantWomanData);
      await pregnantWoman.save();
      
      console.log(`✅ Created PregnantWoman record for ${user.name} with ID: ${pregnantWoman._id}`);
    }
    
    console.log('🎉 Process completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addExistingPregnantWomen();
