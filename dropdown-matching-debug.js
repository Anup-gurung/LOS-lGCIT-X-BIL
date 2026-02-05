// Debug script to verify dropdown value matching in PersonalDetail
// Paste this in the browser console when the form is loaded

console.log('========== DROPDOWN MATCHING DIAGNOSTIC ==========\n');

// Get the stored verified data
const verifiedData = JSON.parse(sessionStorage.getItem('verifiedCustomerData') || '{}');

console.log('📦 Verified Data from sessionStorage:');
console.log('   maritalStatus:', verifiedData.maritalStatus);
console.log('   bankName:', verifiedData.bankName);
console.log('   permCountry:', verifiedData.permCountry);
console.log('   currCountry:', verifiedData.currCountry);

console.log('\n🔍 Form State Data:');
// If React DevTools is available, you can check the component state
// Otherwise, look for data attributes on the form inputs

// Check all Select triggers to see what value is currently set
const selects = document.querySelectorAll('[role="combobox"]');
console.log(`\nFound ${selects.length} Select components:`);

selects.forEach((select, index) => {
  const button = select.closest('button');
  if (button) {
    const label = button.previousElementSibling?.textContent || 'Unknown';
    const selectedValue = button.getAttribute('aria-label') || button.textContent || 'No value';
    console.log(`  ${index + 1}. ${label.trim()}: "${selectedValue}"`);
  }
});

console.log('\n✅ If dropdowns show values (not [Select] placeholder), they are working correctly.');
console.log('❌ If dropdowns show [Select] placeholder, the label-to-code matching needs adjustment.\n');

// Function to test findPkCodeByLabel logic
function testLabelMatching() {
  console.log('\n🧪 TESTING LABEL-TO-CODE MATCHING:');
  
  // Simulate the matchin logic
  const testLabel = 'Married'; // Example maritalStatus
  console.log(`\nTesting: "${testLabel}"`);
  console.log('Expected: Function should find matching option and return its pk_code');
  
  // Check the browser's React component state if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools detected - check component state in DevTools');
  }
}

testLabelMatching();

console.log('\n========== DIAGNOSTIC COMPLETE ==========');
