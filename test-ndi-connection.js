/**
 * NDI Connection Test Script
 * Run this to diagnose NDI authentication issues
 * 
 * Usage: node test-ndi-connection.js
 */

// Manually set your credentials here for testing
const clientId = '3tq7ho23g5risndd90a76jre5f';
const clientSecret = '111rvn964mucumr6c3qq3n2poilvq5v92bkjh58p121nmoverquh';
const authUrl = 'https://staging.bhutanndi.com/authentication/v1/authenticate';

console.log('🔍 Testing NDI Connection...\n');
console.log('Configuration:');
console.log('- Client ID:', clientId ? `${clientId.substring(0, 10)}...` : '❌ MISSING');
console.log('- Client Secret:', clientSecret ? `${clientSecret.substring(0, 10)}...` : '❌ MISSING');
console.log('- Auth URL:', authUrl || '❌ MISSING');
console.log('\n' + '='.repeat(60) + '\n');

if (!clientId || !clientSecret || !authUrl) {
  console.error('❌ Error: Missing required environment variables!');
  console.log('\nPlease check your .env.local file has:');
  console.log('- NDI_CLIENT_ID');
  console.log('- NDI_CLIENT_SECRET');
  console.log('- NDI_AUTH_URL');
  process.exit(1);
}

async function testNDIConnection() {
  try {
    // Test 1: Basic Auth with grant_type only
    console.log('Test 1: OAuth with grant_type=client_credentials (no scope)');
    console.log('-'.repeat(60));
    
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    console.log('Authorization Header:', `Basic ${credentials.substring(0, 20)}...`);
    
    const body1 = new URLSearchParams({
      grant_type: 'client_credentials',
    });
    
    console.log('Request Body:', body1.toString());
    console.log('Sending request to:', authUrl);
    
    const response1 = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: body1.toString(),
    });
    
    console.log('Response Status:', response1.status, response1.statusText);
    console.log('Response Headers:', Object.fromEntries(response1.headers.entries()));
    
    let data1;
    const contentType = response1.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data1 = await response1.json();
    } else {
      data1 = await response1.text();
    }
    
    if (response1.ok) {
      console.log('✅ Success!');
      console.log('Token Data:', JSON.stringify(data1, null, 2));
      return;
    } else {
      console.log('❌ Failed');
      console.log('Error Response:', data1);
    }
    
    // Test 2: Try with scope
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('Test 2: OAuth with grant_type and scope');
    console.log('-'.repeat(60));
    
    const body2 = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid',
    });
    
    console.log('Request Body:', body2.toString());
    
    const response2 = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: body2.toString(),
    });
    
    console.log('Response Status:', response2.status, response2.statusText);
    
    let data2;
    const contentType2 = response2.headers.get('content-type');
    if (contentType2 && contentType2.includes('application/json')) {
      data2 = await response2.json();
    } else {
      data2 = await response2.text();
    }
    
    if (response2.ok) {
      console.log('✅ Success!');
      console.log('Token Data:', JSON.stringify(data2, null, 2));
      return;
    } else {
      console.log('❌ Failed');
      console.log('Error Response:', data2);
    }
    
    // Test 3: Try URL encoding the credentials
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('Test 3: Try with URL-encoded credentials in body');
    console.log('-'.repeat(60));
    
    const body3 = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });
    
    console.log('Request Body:', 'grant_type=client_credentials&client_id=***&client_secret=***');
    
    const response3 = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body3.toString(),
    });
    
    console.log('Response Status:', response3.status, response3.statusText);
    
    let data3;
    const contentType3 = response3.headers.get('content-type');
    if (contentType3 && contentType3.includes('application/json')) {
      data3 = await response3.json();
    } else {
      data3 = await response3.text();
    }
    
    if (response3.ok) {
      console.log('✅ Success!');
      console.log('Token Data:', JSON.stringify(data3, null, 2));
      return;
    } else {
      console.log('❌ Failed');
      console.log('Error Response:', data3);
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    console.log('❌ All tests failed. Possible issues:');
    console.log('1. Invalid client credentials (check with NDI support)');
    console.log('2. Wrong authentication URL');
    console.log('3. Credentials not activated yet');
    console.log('4. IP whitelist restriction');
    console.log('\n📧 Contact NDI Support: ndifeedback@dhi.bt or call 1199');
    
  } catch (error) {
    console.error('\n❌ Connection Error:', error.message);
    console.log('\nPossible causes:');
    console.log('- Network connectivity issue');
    console.log('- NDI server is down');
    console.log('- Firewall blocking the request');
    console.log('- Invalid URL format');
  }
}

testNDIConnection();
