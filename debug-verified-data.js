/**
 * Debug Script: Check Verified Customer Data
 * Run this in the browser console to debug data population issues
 */

console.log('🔍 ===== VERIFIED DATA DEBUG ===== 🔍\n');

// Check sessionStorage
console.log('1️⃣ Checking sessionStorage...');
const verifiedData = sessionStorage.getItem('verifiedCustomerData');

if (!verifiedData) {
  console.error('❌ NO DATA FOUND in sessionStorage["verifiedCustomerData"]');
  console.log('\n📋 Available sessionStorage keys:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    const size = value ? value.length : 0;
    console.log(`   - ${key} (${size} bytes)`);
  }
  console.log('\n💡 SOLUTION: Complete verification first to populate data');
} else {
  console.log('✅ DATA FOUND in sessionStorage["verifiedCustomerData"]');
  
  try {
    const parsed = JSON.parse(verifiedData);
    
    console.log('\n2️⃣ Parsed Data Structure:');
    console.log('   Total fields:', Object.keys(parsed).length);
    
    console.log('\n3️⃣ Key Personal Fields:');
    console.log('   ✓ salutation:', parsed.salutation || '(empty)');
    console.log('   ✓ applicantName:', parsed.applicantName || '(empty)');
    console.log('   ✓ fullName:', parsed.fullName || '(empty)');
    console.log('   ✓ gender:', parsed.gender || '(empty)');
    console.log('   ✓ dateOfBirth:', parsed.dateOfBirth || '(empty)');
    console.log('   ✓ maritalStatus:', parsed.maritalStatus || '(empty)');
    
    console.log('\n4️⃣ Key Contact Fields:');
    console.log('   ✓ currEmail:', parsed.currEmail || parsed.email || '(empty)');
    console.log('   ✓ currContact:', parsed.currContact || parsed.phone || '(empty)');
    console.log('   ✓ nationality:', parsed.nationality || '(empty)');
    
    console.log('\n5️⃣ Key ID Fields:');
    console.log('   ✓ identificationType:', parsed.identificationType || '(empty)');
    console.log('   ✓ identificationNo:', parsed.identificationNo || '(empty)');
    
    console.log('\n6️⃣ All Fields:');
    console.table(parsed);
    
    console.log('\n7️⃣ Verification Status:');
    console.log('   ✓ isVerified:', parsed.isVerified || false);
    console.log('   ✓ verifiedFields:', parsed.verifiedFields?.length || 0, 'fields');
    
    if (!parsed.applicantName || !parsed.currEmail) {
      console.warn('\n⚠️  WARNING: Critical fields are missing!');
      console.warn('   - Check mapCustomerDataToForm() mapping');
      console.warn('   - Check API response structure');
    } else {
      console.log('\n✅ All critical fields present!');
    }
    
  } catch (e) {
    console.error('❌ Error parsing data:', e);
  }
}

console.log('\n=================================\n');
