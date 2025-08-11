#!/usr/bin/env node
/**
 * Review System API Test Suite
 * 
 * Tests the complete Review Configuration & Scoring System API endpoints
 * with proper Supabase Auth integration.
 * 
 * Usage:
 *   node test-review-system.js [--production]
 * 
 * Prerequisites:
 *   - Node.js with fetch support (v18+)
 *   - Valid Supabase project with test data
 *   - Test credentials: researcher@university.edu / researcher123
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const CONFIG = {
  // Supabase configuration
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mfwionbthxrjauwhvwcqw.supabase.co',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1md2lvbmJ0aHhyamF1d2h2d2NxdyIsInJvbGUiOiJhbm9uIiwiZXhwIjo0ODc4MzQ5MDgyfQ.JhGSMJntOtWt7cEAKQFHrmLHpqLU1JcXU8k78lbhFLs',
  
  // API configuration
  PRODUCTION: process.argv.includes('--production'),
  get API_BASE() {
    return this.PRODUCTION 
      ? 'https://workshop-adminstration-site.vercel.app/api'
      : 'http://localhost:3000/api'
  },
  
  // Test credentials
  TEST_CREDENTIALS: {
    email: 'researcher@university.edu',
    password: 'researcher123'
  },
  
  // Colors for console output
  COLORS: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  }
};

class ReviewSystemTester {
  constructor() {
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    this.sessionCookies = '';
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testProgramId = null;
  }

  // Utility methods
  log(message, color = 'white') {
    console.log(`${CONFIG.COLORS[color]}${message}${CONFIG.COLORS.reset}`);
  }

  error(message, error = null) {
    this.log(`❌ ${message}`, 'red');
    if (error) {
      this.log(`   Error: ${error.message || error}`, 'red');
    }
    this.testResults.failed++;
    this.testResults.errors.push(message);
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
    this.testResults.passed++;
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  // Authentication methods
  async authenticate() {
    try {
      this.info('Authenticating with Supabase...');
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: CONFIG.TEST_CREDENTIALS.email,
        password: CONFIG.TEST_CREDENTIALS.password
      });

      if (error) {
        throw new Error(`Authentication failed: ${error.message}`);
      }

      if (!data.session) {
        throw new Error('No session returned from authentication');
      }

      // Store session for API calls
      const { access_token, refresh_token } = data.session;
      this.sessionCookies = `sb-mfwionbthxrjauwhvwcqw-auth-token=${access_token}; sb-mfwionbthxrjauwhvwcqw-auth-token-code-verifier=; HttpOnly; Path=/; SameSite=lax; Secure`;
      
      this.success(`Authenticated as ${data.user.email}`);
      this.info(`User ID: ${data.user.id}`);
      this.info(`Session expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
      
      return data.user;
    } catch (error) {
      this.error('Authentication failed', error);
      throw error;
    }
  }

  async makeAuthenticatedRequest(endpoint, options = {}) {
    const url = `${CONFIG.API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': this.sessionCookies,
      ...options.headers
    };

    try {
      this.info(`Making ${options.method || 'GET'} request to ${endpoint}`);
      
      const response = await fetch(url, {
        ...options,
        headers
      });

      const responseData = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(responseData);
      } catch {
        parsedData = { rawResponse: responseData };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${parsedData.error || parsedData.rawResponse || 'Unknown error'}`);
      }

      return {
        status: response.status,
        data: parsedData,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      this.error(`Request to ${endpoint} failed`, error);
      throw error;
    }
  }

  // Test data setup
  async setupTestData() {
    try {
      this.info('Setting up test data...');
      
      // Get or create a test program
      const { data: programs } = await this.supabase
        .from('programs')
        .select('id, title')
        .limit(1);

      if (programs && programs.length > 0) {
        this.testProgramId = programs[0].id;
        this.success(`Using existing program: ${programs[0].title} (ID: ${this.testProgramId})`);
      } else {
        // Create a test program
        const { data: newProgram, error } = await this.supabase
          .from('programs')
          .insert({
            title: 'Test Review System Program',
            description: 'Program created for testing review system API endpoints',
            application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create test program: ${error.message}`);
        }

        this.testProgramId = newProgram.id;
        this.success(`Created test program: ${newProgram.title} (ID: ${this.testProgramId})`);
      }
      
      return this.testProgramId;
    } catch (error) {
      this.error('Failed to setup test data', error);
      throw error;
    }
  }

  // Test methods for each API endpoint
  async testReviewSettings() {
    this.log('\n📋 Testing Review Settings API...', 'magenta');
    
    try {
      // Test GET (should return null initially)
      const getResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-settings`);
      if (getResponse.data.data === null) {
        this.success('GET review-settings: Returns null for new program');
      } else {
        this.info('GET review-settings: Found existing settings');
      }

      // Test POST (create settings)
      const settingsData = {
        max_score: 100,
        passing_score: 70,
        review_window_days: 14,
        require_all_criteria: true,
        allow_reviewer_comments: true,
        show_scores_to_applicants: false
      };

      const postResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-settings`, {
        method: 'POST',
        body: JSON.stringify(settingsData)
      });

      if (postResponse.status === 201) {
        this.success('POST review-settings: Created successfully');
      } else {
        this.error(`POST review-settings: Expected status 201, got ${postResponse.status}`);
      }

      // Test PUT (update settings)
      const updateData = { max_score: 120, passing_score: 80 };
      const putResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-settings`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      if (putResponse.status === 200 && putResponse.data.data.max_score === 120) {
        this.success('PUT review-settings: Updated successfully');
      } else {
        this.error('PUT review-settings: Update failed or incorrect data');
      }

    } catch (error) {
      this.error('Review settings test failed', error);
    }
  }

  async testReviewCriteria() {
    this.log('\n🎯 Testing Review Criteria API...', 'magenta');
    
    try {
      // Test GET (list criteria)
      const getResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-criteria`);
      this.success('GET review-criteria: Retrieved successfully');

      // Test POST (create criteria)
      const criteriaData = {
        name: 'Technical Merit',
        description: 'Evaluation of technical approach and feasibility',
        weight: 0.4,
        max_score: 10,
        is_required: true,
        evaluation_guide: 'Consider innovation, technical soundness, and implementability'
      };

      const postResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-criteria`, {
        method: 'POST',
        body: JSON.stringify(criteriaData)
      });

      if (postResponse.status === 201) {
        this.success('POST review-criteria: Created successfully');
        const criteriaId = postResponse.data.data.id;

        // Test PUT (update criteria)
        const updateData = { weight: 0.5, max_score: 15 };
        const putResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-criteria/${criteriaId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        if (putResponse.status === 200 && putResponse.data.data.weight === 0.5) {
          this.success('PUT review-criteria: Updated successfully');
        } else {
          this.error('PUT review-criteria: Update failed');
        }

        // Test DELETE
        const deleteResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-criteria/${criteriaId}`, {
          method: 'DELETE'
        });

        if (deleteResponse.status === 200) {
          this.success('DELETE review-criteria: Deleted successfully');
        } else {
          this.error('DELETE review-criteria: Delete failed');
        }
      } else {
        this.error(`POST review-criteria: Expected status 201, got ${postResponse.status}`);
      }

    } catch (error) {
      this.error('Review criteria test failed', error);
    }
  }

  async testReviewTemplates() {
    this.log('\n📝 Testing Review Templates API...', 'magenta');
    
    try {
      // Test GET (list templates)
      const getResponse = await this.makeAuthenticatedRequest('/review-templates');
      this.success('GET review-templates: Retrieved successfully');

      // Test POST (create template)
      const templateData = {
        name: 'Standard Research Review',
        description: 'Standard template for research proposal reviews',
        is_active: true,
        criteria: [
          {
            name: 'Research Merit',
            description: 'Significance and innovation of the research',
            weight: 0.3,
            max_score: 10,
            is_required: true,
            evaluation_guide: 'Assess novelty, impact, and scientific rigor'
          },
          {
            name: 'Methodology',
            description: 'Appropriateness of proposed methods',
            weight: 0.3,
            max_score: 10,
            is_required: true,
            evaluation_guide: 'Evaluate experimental design and analytical approaches'
          },
          {
            name: 'Feasibility',
            description: 'Likelihood of successful completion',
            weight: 0.4,
            max_score: 10,
            is_required: true,
            evaluation_guide: 'Consider timeline, resources, and potential obstacles'
          }
        ]
      };

      const postResponse = await this.makeAuthenticatedRequest('/review-templates', {
        method: 'POST',
        body: JSON.stringify(templateData)
      });

      if (postResponse.status === 201) {
        this.success('POST review-templates: Created successfully');
        const templateId = postResponse.data.data.id;

        // Test applying template to program
        const applyResponse = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/apply-template`, {
          method: 'POST',
          body: JSON.stringify({ template_id: templateId })
        });

        if (applyResponse.status === 200) {
          this.success('POST apply-template: Template applied successfully');
        } else {
          this.error('POST apply-template: Failed to apply template');
        }

      } else {
        this.error(`POST review-templates: Expected status 201, got ${postResponse.status}`);
      }

    } catch (error) {
      this.error('Review templates test failed', error);
    }
  }

  async testReviewStats() {
    this.log('\n📊 Testing Review Statistics API...', 'magenta');
    
    try {
      const response = await this.makeAuthenticatedRequest(`/programs/${this.testProgramId}/review-stats`);
      
      if (response.status === 200) {
        this.success('GET review-stats: Retrieved successfully');
        
        const stats = response.data.data;
        this.info(`Statistics: ${JSON.stringify({
          totalApplications: stats.total_applications,
          completedReviews: stats.completed_reviews,
          averageScore: stats.average_score,
          pendingReviews: stats.pending_reviews
        }, null, 2)}`);
      } else {
        this.error(`GET review-stats: Expected status 200, got ${response.status}`);
      }

    } catch (error) {
      this.error('Review statistics test failed', error);
    }
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Review System API Test Suite', 'cyan');
    this.log(`Environment: ${CONFIG.PRODUCTION ? 'PRODUCTION' : 'LOCAL'}`, 'yellow');
    this.log(`API Base: ${CONFIG.API_BASE}`, 'blue');
    this.log(`Supabase URL: ${CONFIG.SUPABASE_URL}`, 'blue');
    
    try {
      // Step 1: Authenticate
      await this.authenticate();
      
      // Step 2: Setup test data
      await this.setupTestData();
      
      // Step 3: Run API tests
      await this.testReviewSettings();
      await this.testReviewCriteria();
      await this.testReviewTemplates();
      await this.testReviewStats();
      
      // Step 4: Summary
      this.printSummary();
      
    } catch (error) {
      this.error('Test suite failed to complete', error);
      this.printSummary();
      process.exit(1);
    }
  }

  printSummary() {
    this.log('\n📈 Test Summary', 'cyan');
    this.log('═══════════════', 'cyan');
    this.success(`Passed: ${this.testResults.passed}`);
    
    if (this.testResults.failed > 0) {
      this.error(`Failed: ${this.testResults.failed}`);
      this.log('\nFailure Details:', 'red');
      this.testResults.errors.forEach(error => {
        this.log(`  • ${error}`, 'red');
      });
    }
    
    const total = this.testResults.passed + this.testResults.failed;
    const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(1) : 0;
    
    if (successRate >= 90) {
      this.log(`\n🎉 Success Rate: ${successRate}% - Excellent!`, 'green');
    } else if (successRate >= 70) {
      this.log(`\n✨ Success Rate: ${successRate}% - Good`, 'yellow');
    } else {
      this.log(`\n⚠️  Success Rate: ${successRate}% - Needs attention`, 'red');
    }
  }

  // Additional utility method for debugging
  async debugAuthentication() {
    this.log('\n🔍 Debug Authentication Flow', 'magenta');
    
    try {
      // Check current session
      const { data: session } = await this.supabase.auth.getSession();
      this.info(`Current session: ${session.session ? 'Active' : 'None'}`);
      
      if (session.session) {
        this.info(`Session expires: ${new Date(session.session.expires_at * 1000)}`);
        this.info(`Access token (first 50 chars): ${session.session.access_token.substring(0, 50)}...`);
      }
      
      // Test direct API call
      const testResponse = await this.makeAuthenticatedRequest('/health');
      this.success('Direct API authentication test passed');
      
    } catch (error) {
      this.error('Authentication debug failed', error);
    }
  }
}

// CLI usage
async function main() {
  const tester = new ReviewSystemTester();
  
  // Handle CLI arguments
  if (process.argv.includes('--debug-auth')) {
    await tester.authenticate();
    await tester.debugAuthentication();
    return;
  }
  
  if (process.argv.includes('--help')) {
    console.log(`
Review System API Test Suite

Usage:
  node test-review-system.js [options]

Options:
  --production     Test against production API (default: local)
  --debug-auth     Debug authentication flow only
  --help           Show this help message

Environment Variables:
  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase anonymous key

Test Credentials:
  Email: researcher@university.edu
  Password: researcher123
    `);
    return;
  }
  
  await tester.runAllTests();
}

// Run the tests
if (require.main === module) {
  main().catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { ReviewSystemTester, CONFIG };