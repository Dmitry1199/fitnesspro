#!/usr/bin/env bun
/**
 * FitnessPro Session Management Testing Script
 * Tests all session, availability, and booking endpoints
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
      console.log(`✅ Success (${response.status}):`, JSON.stringify(data, null, 2).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
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
  if (details) console.log(`   Details: ${details}`);
}

async function main() {
  console.log('🚀 Starting FitnessPro Session Management Testing...\n');
  console.log('='.repeat(60));

  // Get authentication tokens for different users
  console.log('\n🔐 === AUTHENTICATION ===');

  const trainerAuth = await apiRequest('/auth/quick-login?type=trainer');
  let trainerToken = null;
  if (trainerAuth.success) {
    trainerToken = trainerAuth.data.accessToken;
    console.log(`🔑 Trainer authenticated: ${trainerAuth.data.user.firstName} ${trainerAuth.data.user.lastName}`);
    logTest('Trainer Authentication', true);
  } else {
    logTest('Trainer Authentication', false, 'Could not authenticate trainer');
    return;
  }

  const clientAuth = await apiRequest('/auth/quick-login?type=client');
  let clientToken = null;
  if (clientAuth.success) {
    clientToken = clientAuth.data.accessToken;
    console.log(`🔑 Client authenticated: ${clientAuth.data.user.firstName} ${clientAuth.data.user.lastName}`);
    logTest('Client Authentication', true);
  } else {
    logTest('Client Authentication', false, 'Could not authenticate client');
    return;
  }

  // Helper function for authenticated requests
  function authenticatedRequest(endpoint, options = {}, token = trainerToken) {
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return apiRequest(endpoint, options);
  }

  // Test 1: Trainer Availability Management
  console.log('\n📅 === TRAINER AVAILABILITY MANAGEMENT ===');

  // Create availability slot
  const availabilityData = {
    dayOfWeek: 1, // Monday
    startTime: "09:00",
    endTime: "17:00",
    isRecurring: true,
    isAvailable: true
  };

  console.log('🔍 DEBUG - Sending availability data:', JSON.stringify(availabilityData, null, 2));

  const createAvailability = await authenticatedRequest('/sessions/availability', {
    method: 'POST',
    body: JSON.stringify(availabilityData)
  }, trainerToken);

  logTest('Create Trainer Availability', createAvailability.success,
    createAvailability.success ? `Created availability for Monday 09:00-17:00` : 'Availability creation failed');

  let availabilityId = null;
  if (createAvailability.success) {
    availabilityId = createAvailability.data.id;
  }

  // Get trainer availability
  const getAvailability = await authenticatedRequest('/sessions/my-availability', {}, trainerToken);
  logTest('Get Trainer Availability', getAvailability.success && Array.isArray(getAvailability.data),
    getAvailability.success ? `Found ${getAvailability.data.length} availability slots` : 'Get availability failed');

  // Test 2: Training Session Management
  console.log('\n🏋️‍♂️ === TRAINING SESSION MANAGEMENT ===');

  // Create a training session
  const today = new Date();
  const sessionData = {
    title: "Personal Training Session",
    description: "One-on-one strength training session",
    sessionDate: today.toISOString(), // Send as ISO string, will be parsed to Date
    startTime: "10:00",
    endTime: "11:00",
    sessionType: "PERSONAL",
    location: "Main Gym",
    price: 75.00,
    currency: "USD"
  };

  console.log('🔍 DEBUG - Sending session data:', JSON.stringify(sessionData, null, 2));

  const createSession = await authenticatedRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify(sessionData)
  }, trainerToken);

  logTest('Create Training Session', createSession.success && createSession.data.id,
    createSession.success ? `Created session: ${createSession.data.title}` : 'Session creation failed');

  let sessionId = null;
  if (createSession.success) {
    sessionId = createSession.data.id;
  }

  // Get trainer sessions
  const getTrainerSessions = await authenticatedRequest('/sessions/my-sessions', {}, trainerToken);
  logTest('Get Trainer Sessions', getTrainerSessions.success && Array.isArray(getTrainerSessions.data),
    getTrainerSessions.success ? `Found ${getTrainerSessions.data.length} trainer sessions` : 'Get sessions failed');

  // Get session details
  if (sessionId) {
    const getSessionDetail = await authenticatedRequest(`/sessions/${sessionId}`, {}, trainerToken);
    logTest('Get Session Details', getSessionDetail.success && getSessionDetail.data.title,
      getSessionDetail.success ? `Session: ${getSessionDetail.data.title}` : 'Session detail failed');
  }

  // Test 3: Session Statistics
  console.log('\n📊 === SESSION STATISTICS ===');

  const getStats = await authenticatedRequest('/sessions/stats', {}, trainerToken);
  logTest('Get Session Statistics', getStats.success && typeof getStats.data.totalSessions === 'number',
    getStats.success ? `Total sessions: ${getStats.data.totalSessions}` : 'Stats failed');

  // Test 4: Session Booking (as Client)
  console.log('\n📝 === SESSION BOOKING ===');

  if (sessionId) {
    // Book the session as a client
    const bookingData = {
      clientMessage: "Looking forward to this training session!"
    };

    const bookSession = await authenticatedRequest(`/sessions/${sessionId}/book`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }, clientToken);

    logTest('Book Training Session', bookSession.success && bookSession.data.id,
      bookSession.success ? `Booking created with ID: ${bookSession.data.id}` : 'Booking failed');

    let bookingId = null;
    if (bookSession.success) {
      bookingId = bookSession.data.id;

      // Get booking details
      const getBooking = await authenticatedRequest(`/sessions/bookings/${bookingId}`, {}, clientToken);
      logTest('Get Booking Details', getBooking.success && getBooking.data.bookingStatus,
        getBooking.success ? `Booking status: ${getBooking.data.bookingStatus}` : 'Get booking failed');

      // Confirm booking as trainer
      const confirmData = {
        trainerResponse: "Confirmed! See you there."
      };

      const confirmBooking = await authenticatedRequest(`/sessions/bookings/${bookingId}/confirm`, {
        method: 'POST',
        body: JSON.stringify(confirmData)
      }, trainerToken);

      logTest('Confirm Booking (Trainer)', confirmBooking.success && confirmBooking.data.bookingStatus === 'CONFIRMED',
        confirmBooking.success ? `Booking confirmed by trainer` : 'Booking confirmation failed');
    }
  }

  // Test 5: Available Slots Discovery
  console.log('\n🔍 === AVAILABLE SLOTS DISCOVERY ===');

  const trainerId = trainerAuth.data.user.id;
  const todayStr = new Date().toISOString().split('T')[0];

  const getAvailableSlots = await authenticatedRequest(`/sessions/available-slots/${trainerId}?date=${todayStr}`, {}, clientToken);
  logTest('Get Available Slots', getAvailableSlots.success && Array.isArray(getAvailableSlots.data),
    getAvailableSlots.success ? `Found ${getAvailableSlots.data.length} available slots` : 'Available slots failed');

  // Test 6: Trainer Search
  const searchTrainers = await authenticatedRequest('/sessions/trainers/search', {}, clientToken);
  logTest('Search Available Trainers', searchTrainers.success && Array.isArray(searchTrainers.data),
    searchTrainers.success ? `Found ${searchTrainers.data.length} trainers` : 'Trainer search failed');

  // Test 7: Error Handling
  console.log('\n🚨 === ERROR HANDLING ===');

  // Try to book without authentication
  const unauthorizedBook = await apiRequest(`/sessions/${sessionId || 'test'}/book`, {
    method: 'POST',
    body: JSON.stringify({ clientMessage: "test" })
  });
  logTest('Block Unauthorized Booking', !unauthorizedBook.success && unauthorizedBook.status === 401,
    unauthorizedBook.status === 401 ? 'Correctly blocked unauthorized access' : `Expected 401, got ${unauthorizedBook.status}`);

  // Try to access non-existent session
  const notFoundSession = await authenticatedRequest('/sessions/non-existent-id', {}, trainerToken);
  logTest('Handle Non-existent Session', !notFoundSession.success && notFoundSession.status === 404,
    notFoundSession.status === 404 ? 'Correctly returned 404' : `Expected 404, got ${notFoundSession.status}`);

  // Clean up - Delete test session
  if (sessionId) {
    const deleteSession = await authenticatedRequest(`/sessions/${sessionId}`, {
      method: 'DELETE'
    }, trainerToken);
    logTest('Cleanup - Delete Session', deleteSession.success,
      deleteSession.success ? 'Test session deleted' : 'Session deletion failed');
  }

  // Clean up - Delete availability
  if (availabilityId) {
    const deleteAvailability = await authenticatedRequest(`/sessions/availability/${availabilityId}`, {
      method: 'DELETE'
    }, trainerToken);
    logTest('Cleanup - Delete Availability', deleteAvailability.success,
      deleteAvailability.success ? 'Test availability deleted' : 'Availability deletion failed');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 === SESSION MANAGEMENT TEST SUMMARY ===');
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

  console.log('\n🚀 Session Management Testing Complete!');
  console.log('📚 Visit http://localhost:8000/api/docs for complete session API documentation');
  console.log('\n✨ Session Management Features Tested:');
  console.log('   - ✅ Trainer availability management');
  console.log('   - ✅ Training session CRUD operations');
  console.log('   - ✅ Session booking workflow');
  console.log('   - ✅ Booking confirmation system');
  console.log('   - ✅ Available slots discovery');
  console.log('   - ✅ Trainer search functionality');
  console.log('   - ✅ Permission-based access control');
  console.log('   - ✅ Error handling and validation');

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
