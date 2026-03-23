import React from 'react';

const SimpleTestDashboard = ({ womanId, userRole }) => {
  console.log('SimpleTestDashboard: Component mounted with props:', { womanId, userRole });
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: 'blue', fontSize: '24px' }}>Simple Test Dashboard</h1>
      <p>Woman ID: {womanId}</p>
      <p>User Role: {userRole}</p>
      <p>Time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', border: '1px solid #ccc' }}>
        <p>If you can see this, the component is working!</p>
      </div>
    </div>
  );
};

export default SimpleTestDashboard;
