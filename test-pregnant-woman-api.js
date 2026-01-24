// Test pregnant woman registration endpoint
const API_BASE_URL = 'http://localhost:5005/api';

const testData = {
  name: 'Test Pregnant Woman',
  email: 'test.pregnant@example.com',
  password: 'TestPassword123',
  phone: '9876543210',
  dateOfBirth: '1995-01-15',
  address: {
    street: 'Test Street',
    city: 'Test City',
    state: 'Kerala',
    pincode: '686522'
  },
  husbandName: 'Test Husband',
  husbandPhone: '9876543211',
  lastMenstrualPeriod: '2025-01-01',
  expectedDeliveryDate: '2025-10-09',
  pregnancyNumber: 1,
  bloodGroup: 'O+',
  height: 160,
  prePregnancyWeight: 60,
  currentWeight: 70,
  linkedAnganwadiCenter: 'AK34',
  specialNeeds: 'Test special needs'
};

async function testRegistration() {
  try {
    console.log('Testing Pregnant Woman Registration...');
    console.log('Sending data:', testData);
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...testData,
        role: 'pregnant-woman',
        roleSpecificData: {
          pregnantWomanDetails: {
            husbandName: testData.husbandName,
            husbandPhone: testData.husbandPhone,
            lastMenstrualPeriod: testData.lastMenstrualPeriod,
            expectedDeliveryDate: testData.expectedDeliveryDate,
            pregnancyNumber: testData.pregnancyNumber,
            bloodGroup: testData.bloodGroup,
            height: testData.height,
            prePregnancyWeight: testData.prePregnancyWeight,
            currentWeight: testData.currentWeight,
            anganwadiCenter: testData.linkedAnganwadiCenter,
            specialNeeds: testData.specialNeeds
          }
        }
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRegistration();
