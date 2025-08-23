#!/usr/bin/env bun
/**
 * FitnessPro API Testing Script with Authentication
 * Tests all workout management endpoints with JWT authentication
 */

const API_BASE = 'http://localhost:8000/api';

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`\n🔄 ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(data, null, 2).substring(0, 300) + (JSON.stringify(data).length > 300 ? '...' : ''));
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ Error (${response.status}):`, data);
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`❌ Network Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, success, details = '') {
  testResults.tests.push({ name, success, details });
  if (success) {
    testResults.passed++;
    console.log(`✅ TEST PASSED: ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ TEST FAILED: ${name} - ${details}`);
  }
}

async function main() {
  console.log('🚀 Starting FitnessPro API Testing with Authentication...\n');
  console.log('='.repeat(60));

  // Get authentication token first
  console.log('\n🔐 === AUTHENTICATION ===');

  const authResult = await apiRequest('/auth/quick-login?type=trainer');
  let authToken = null;

  if (authResult.success && authResult.data.accessToken) {
    authToken = authResult.data.accessToken;
    console.log(`🔑 Authentication successful for user: ${authResult.data.user.firstName} ${authResult.data.user.lastName} (${authResult.data.user.role})`);
    logTest('Quick Login Authentication', true, `Logged in as ${authResult.data.user.role}`);
  } else {
    console.log('❌ Authentication failed - running tests without auth');
    logTest('Quick Login Authentication', false, 'Could not obtain auth token');
  }

  // Helper function for authenticated requests
  function authenticatedRequest(endpoint, options = {}) {
    if (authToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${authToken}`
      };
    }
    return apiRequest(endpoint, options);
  }

  // Test test users endpoint
  const testUsers = await apiRequest('/auth/test-users');
  logTest('Get Test Users List', testUsers.success, testUsers.success ? `Found ${testUsers.data.users?.length || 0} test users` : 'Test users failed');

  // Test 1: Health Check
  console.log('\n📊 === HEALTH & BASIC ENDPOINTS ===');

  const health = await apiRequest('/health');
  logTest('Health Check', health.success, health.success ? '' : 'Health endpoint failed');

  const root = await apiRequest('/');
  logTest('Root API Info', root.success, root.success ? '' : 'Root endpoint failed');

  // Test 2: Category Management (with auth)
  console.log('\n📋 === CATEGORY MANAGEMENT ===');

  const categories = await authenticatedRequest('/categories/exercise-categories');
  logTest('Get Exercise Categories', categories.success && Array.isArray(categories.data),
    categories.success ? `Found ${categories.data?.length || 0} categories` : 'Categories fetch failed');

  const muscleGroups = await authenticatedRequest('/categories/muscle-groups');
  logTest('Get Muscle Groups', muscleGroups.success && Array.isArray(muscleGroups.data),
    muscleGroups.success ? `Found ${muscleGroups.data?.length || 0} muscle groups` : 'Muscle groups fetch failed');

  const equipment = await authenticatedRequest('/categories/equipment');
  logTest('Get Equipment', equipment.success && Array.isArray(equipment.data),
    equipment.success ? `Found ${equipment.data?.length || 0} equipment items` : 'Equipment fetch failed');

  const categoryStats = await authenticatedRequest('/categories/stats');
  logTest('Category Statistics', categoryStats.success && categoryStats.data?.totalCategories,
    categoryStats.success ? `${categoryStats.data.totalCategories} categories, ${categoryStats.data.totalMuscleGroups} muscle groups` : 'Stats failed');

  // Test 3: Exercise Management (with auth)
  console.log('\n🏋️‍♂️ === EXERCISE MANAGEMENT ===');

  const exercises = await authenticatedRequest('/exercises');
  logTest('Get All Exercises', exercises.success && Array.isArray(exercises.data),
    exercises.success ? `Found ${exercises.data?.length || 0} exercises` : 'Exercises fetch failed');

  const exerciseStats = await authenticatedRequest('/exercises/stats');
  logTest('Exercise Statistics', exerciseStats.success && exerciseStats.data?.totalExercises,
    exerciseStats.success ? `${exerciseStats.data.totalExercises} total exercises, ${exerciseStats.data.customExercises} custom` : 'Exercise stats failed');

  // Test filtered searches
  if (categories.success && categories.data.length > 0) {
    const categoryId = categories.data[0].id;
    const exercisesByCategory = await authenticatedRequest(`/exercises/category/${categoryId}`);
    logTest('Filter Exercises by Category', exercisesByCategory.success,
      exercisesByCategory.success ? `Found ${exercisesByCategory.data?.length || 0} exercises in category` : 'Category filter failed');
  }

  if (muscleGroups.success && muscleGroups.data.length > 0) {
    const muscleGroupId = muscleGroups.data[0].id;
    const exercisesByMuscle = await authenticatedRequest(`/exercises/muscle-group/${muscleGroupId}`);
    logTest('Filter Exercises by Muscle Group', exercisesByMuscle.success,
      exercisesByMuscle.success ? `Found ${exercisesByMuscle.data?.length || 0} exercises for muscle group` : 'Muscle group filter failed');
  }

  // Test search functionality
  const searchResults = await authenticatedRequest('/exercises?search=push&difficultyLevel=BEGINNER');
  logTest('Exercise Search & Filter', searchResults.success,
    searchResults.success ? `Search returned ${searchResults.data?.length || 0} results` : 'Search failed');

  // Test 4: Workout Management (with auth)
  console.log('\n💪 === WORKOUT MANAGEMENT ===');

  const workouts = await authenticatedRequest('/workouts');
  logTest('Get All Workouts', workouts.success && Array.isArray(workouts.data),
    workouts.success ? `Found ${workouts.data?.length || 0} workouts` : 'Workouts fetch failed');

  const publicWorkouts = await authenticatedRequest('/workouts/public');
  logTest('Get Public Workouts', publicWorkouts.success,
    publicWorkouts.success ? `Found ${publicWorkouts.data?.length || 0} public workouts` : 'Public workouts failed');

  const templateWorkouts = await authenticatedRequest('/workouts/templates');
  logTest('Get Template Workouts', templateWorkouts.success,
    templateWorkouts.success ? `Found ${templateWorkouts.data?.length || 0} template workouts` : 'Template workouts failed');

  const workoutStats = await authenticatedRequest('/workouts/stats');
  logTest('Workout Statistics', workoutStats.success && workoutStats.data?.totalWorkouts,
    workoutStats.success ? `${workoutStats.data.totalWorkouts} total, ${workoutStats.data.templateWorkouts} templates` : 'Workout stats failed');

  // Test individual workout details
  if (workouts.success && workouts.data.length > 0) {
    const workoutId = workouts.data[0].id;

    const workoutDetail = await authenticatedRequest(`/workouts/${workoutId}`);
    logTest('Get Workout Details', workoutDetail.success && workoutDetail.data?.exercises,
      workoutDetail.success ? `Workout has ${workoutDetail.data.exercises?.length || 0} exercises` : 'Workout detail failed');

    const workoutMetrics = await authenticatedRequest(`/workouts/${workoutId}/metrics`);
    logTest('Calculate Workout Metrics', workoutMetrics.success && workoutMetrics.data?.exerciseCount !== undefined,
      workoutMetrics.success ? `${workoutMetrics.data.exerciseCount} exercises, ${workoutMetrics.data.estimatedDuration} min` : 'Metrics calculation failed');
  }

  // Test 5: Advanced Features (with auth)
  console.log('\n⚡ === ADVANCED FEATURES ===');

  // Test workout filtering
  const beginnerWorkouts = await authenticatedRequest('/workouts?difficultyLevel=BEGINNER&isTemplate=true');
  logTest('Filter Workouts (Beginner Templates)', beginnerWorkouts.success,
    beginnerWorkouts.success ? `Found ${beginnerWorkouts.data?.length || 0} beginner templates` : 'Workout filtering failed');

  // Test exercise search with multiple filters
  const complexSearch = await authenticatedRequest('/exercises?categoryId=' + (categories.data?.[0]?.id || '') + '&difficultyLevel=BEGINNER&isCustom=false');
  logTest('Complex Exercise Filtering', complexSearch.success,
    complexSearch.success ? `Found ${complexSearch.data?.length || 0} filtered exercises` : 'Complex filtering failed');

  // Test 6: Create Exercise (POST request with auth)
  console.log('\n📝 === CREATE OPERATIONS ===');

  if (categories.success && categories.data && categories.data.length > 0 && muscleGroups.success && muscleGroups.data && muscleGroups.data.length > 0) {
    const newExercise = {
      name: 'API Test Exercise',
      description: 'Test exercise created via API testing',
      instructions: '1. Test step 1\n2. Test step 2\n3. Test step 3',
      difficultyLevel: 'BEGINNER',
      duration: 30,
      caloriesPerMin: 5,
      categoryId: categories.data[0].id,
      muscleGroupIds: [muscleGroups.data[0].id],
      equipmentIds: []
    };

    console.log('🔍 DEBUG - Exercise data being sent:', JSON.stringify(newExercise, null, 2));
    console.log('🔍 DEBUG - Category ID:', categories.data[0].id, '- Type:', typeof categories.data[0].id);
    console.log('🔍 DEBUG - Muscle Group ID:', muscleGroups.data[0].id, '- Type:', typeof muscleGroups.data[0].id);

    const createExercise = await authenticatedRequest('/exercises', {
      method: 'POST',
      body: JSON.stringify(newExercise)
    });

    logTest('Create New Exercise', createExercise.success && createExercise.data?.name,
      createExercise.success ? `Created exercise: ${createExercise.data.name}` : `Exercise creation failed - ${JSON.stringify(createExercise.data)}`);
  } else {
    // Test failed - missing prerequisite data
    logTest('Create New Exercise', false,
      `Prerequisites not met - Categories: ${categories.success ? categories.data?.length || 0 : 'failed'}, Muscle Groups: ${muscleGroups.success ? muscleGroups.data?.length || 0 : 'failed'}`);
  }

  // Test 7: Error Handling (with auth)
  console.log('\n🚨 === ERROR HANDLING ===');

  const notFound = await authenticatedRequest('/exercises/non-existent-id');
  logTest('Handle Non-existent Exercise', !notFound.success && notFound.status === 404,
    notFound.status === 404 ? 'Correctly returned 404' : `Expected 404, got ${notFound.status}`);

  const invalidWorkout = await authenticatedRequest('/workouts/invalid-uuid');
  logTest('Handle Invalid Workout ID', !invalidWorkout.success,
    !invalidWorkout.success ? 'Correctly handled invalid ID' : 'Should have failed');

  // Test unauthorized access (without token)
  const unauthorizedAccess = await apiRequest('/exercises');
  logTest('Unauthorized Access Blocked', !unauthorizedAccess.success && unauthorizedAccess.status === 401,
    unauthorizedAccess.status === 401 ? 'Correctly blocked unauthorized access' : `Expected 401, got ${unauthorizedAccess.status}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 === TEST SUMMARY ===');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total: ${testResults.tests.length}`);
  console.log(`🎉 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(t => !t.success)
      .forEach(t => console.log(`   - ${t.name}: ${t.details}`));
  }

  console.log('\n🚀 API Testing Complete!');
  console.log('📚 Visit http://localhost:8000/api/docs for interactive API documentation');
  console.log('🔐 Use /api/auth/quick-login?type=trainer for authentication testing');

  return testResults.failed === 0;
}

// Run tests
main()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
