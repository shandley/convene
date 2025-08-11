// Test Review System APIs in Production
// Run with: node test-review-prod.js

const API_URL = 'https://workshop-adminstration-site.vercel.app/api';

async function testReviewAPIs() {
  console.log('🔐 Testing Review System APIs...');
  console.log('================================\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'researcher@university.edu',
        password: 'researcher123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    // Extract cookies for subsequent requests
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful\n');

    // 2. Get programs
    console.log('2. Getting programs...');
    const programsResponse = await fetch(`${API_URL}/programs`, {
      headers: { 'Cookie': cookies }
    });
    const programs = await programsResponse.json();
    
    if (!programs.data || programs.data.length === 0) {
      console.log('No programs found. Creating a test program...');
      
      // Create a test program
      const createResponse = await fetch(`${API_URL}/programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          title: 'Review System Test Program',
          description: 'Testing the review configuration system',
          start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          application_deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          capacity: 30,
          status: 'draft'
        })
      });
      
      const newProgram = await createResponse.json();
      programs.data = [newProgram.data];
    }

    const program = programs.data[0];
    console.log(`Using Program: ${program.title} (ID: ${program.id})\n`);

    // 3. Create/Update review settings
    console.log('3. Creating review settings...');
    const settingsResponse = await fetch(`${API_URL}/programs/${program.id}/review-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        enable_scoring: true,
        scoring_type: 'weighted',
        max_score: 100,
        min_reviewers: 2,
        max_reviewers: 5,
        allow_comments: true,
        blind_review: false,
        auto_calculate_final_score: true
      })
    });

    const settings = await settingsResponse.json();
    console.log('Review settings:', {
      enable_scoring: settings.data?.enable_scoring,
      scoring_type: settings.data?.scoring_type,
      max_score: settings.data?.max_score
    }, '\n');

    // 4. Get templates
    console.log('4. Getting review templates...');
    const templatesResponse = await fetch(`${API_URL}/review-templates`, {
      headers: { 'Cookie': cookies }
    });
    const templates = await templatesResponse.json();
    console.log(`Found ${templates.data?.length || 0} templates`);

    if (templates.data && templates.data.length > 0) {
      const template = templates.data[0];
      console.log(`Using Template: ${template.name}\n`);

      // 5. Apply template
      console.log('5. Applying template to program...');
      const applyResponse = await fetch(`${API_URL}/programs/${program.id}/apply-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({ templateId: template.id })
      });

      const applyResult = await applyResponse.json();
      console.log(applyResult.message || 'Template applied');
      console.log(`Created ${applyResult.criteriaCreated || 0} criteria\n`);
    }

    // 6. Get review criteria
    console.log('6. Getting review criteria...');
    const criteriaResponse = await fetch(`${API_URL}/programs/${program.id}/review-criteria`, {
      headers: { 'Cookie': cookies }
    });
    const criteria = await criteriaResponse.json();
    console.log(`Program has ${criteria.data?.length || 0} review criteria`);
    
    if (criteria.data && criteria.data.length > 0) {
      console.log('First 2 criteria:');
      criteria.data.slice(0, 2).forEach(c => {
        console.log(`  - ${c.name}: weight=${c.weight}, max_score=${c.max_score}`);
      });
    }
    console.log();

    // 7. Add custom criterion
    console.log('7. Adding custom criterion...');
    const customResponse = await fetch(`${API_URL}/programs/${program.id}/review-criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        name: 'API Test Criterion',
        description: 'Testing the review criteria API',
        weight: 0.15,
        max_score: 10,
        scoring_type: 'numeric',
        is_required: true
      })
    });

    const customCriterion = await customResponse.json();
    if (customCriterion.data) {
      console.log(`Created: ${customCriterion.data.name} (ID: ${customCriterion.data.id})\n`);
    }

    // 8. Get review stats
    console.log('8. Getting review statistics...');
    const statsResponse = await fetch(`${API_URL}/programs/${program.id}/review-stats`, {
      headers: { 'Cookie': cookies }
    });
    const stats = await statsResponse.json();
    console.log('Review statistics:', stats.data || 'No statistics yet\n');

    console.log('✅ All API tests completed successfully!');
    console.log('================================');
    console.log('\nNext steps:');
    console.log('1. Create an application for this program');
    console.log('2. Assign reviewers to the application');
    console.log('3. Submit review scores');
    console.log('4. Check updated statistics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testReviewAPIs();