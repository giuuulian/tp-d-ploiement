/**
 * Simple E2E tests using HTTP requests
 * No Cypress dependency to avoid Windows PowerShell issues
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testsPassed = 0;
let testsFailed = 0;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data ? JSON.parse(data) : null,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} (expected ${expected}, got ${actual})`);
  }
}

function assertExists(value, message) {
  if (!value) {
    throw new Error(`${message} (value does not exist)`);
  }
}

async function runTests() {
  console.log('\n=== Starting E2E Tests ===\n');

  // Reset before tests
  await makeRequest('POST', '/api/reset');

  // Test 1: Health Check
  await test('GET /health should return status 200', async () => {
    const res = await makeRequest('GET', '/health');
    assertEqual(res.status, 200, 'Health check status');
    assertEqual(res.body.status, 'ok', 'Health check status field');
    assertExists(res.body.timestamp, 'Health check timestamp');
  });

  // Test 2: Get all tasks
  await test('GET /api/tasks should return array', async () => {
    const res = await makeRequest('GET', '/api/tasks');
    assertEqual(res.status, 200, 'GET tasks status');
    if (!Array.isArray(res.body)) {
      throw new Error('Response is not an array');
    }
    if (res.body.length === 0) {
      throw new Error('Tasks array is empty');
    }
  });

  // Test 3: Create task
  await test('POST /api/tasks should create task', async () => {
    const newTask = { title: 'E2E Test Task' };
    const res = await makeRequest('POST', '/api/tasks', newTask);
    assertEqual(res.status, 201, 'Create task status');
    assertExists(res.body.id, 'Task ID');
    assertEqual(res.body.title, 'E2E Test Task', 'Task title');
    assertEqual(res.body.completed, false, 'Task completed field');
  });

  // Test 4: Get specific task
  await test('GET /api/tasks/:id should return task', async () => {
    const res = await makeRequest('GET', '/api/tasks/1');
    assertEqual(res.status, 200, 'GET specific task status');
    assertExists(res.body.id, 'Task ID');
  });

  // Test 5: Update task
  await test('PUT /api/tasks/:id should update task', async () => {
    const update = { title: 'Updated Task', completed: true };
    const res = await makeRequest('PUT', '/api/tasks/1', update);
    assertEqual(res.status, 200, 'PUT task status');
    assertEqual(res.body.title, 'Updated Task', 'Updated title');
    assertEqual(res.body.completed, true, 'Updated completed field');
  });

  // Test 6: Delete task
  await test('DELETE /api/tasks/:id should delete task', async () => {
    // Create a task first
    const createRes = await makeRequest('POST', '/api/tasks', { title: 'Task to delete' });
    const taskId = createRes.body.id;

    // Delete it
    const res = await makeRequest('DELETE', `/api/tasks/${taskId}`);
    assertEqual(res.status, 204, 'DELETE task status');

    // Verify it's gone
    const getRes = await makeRequest('GET', `/api/tasks/${taskId}`);
    assertEqual(getRes.status, 404, 'Task should not exist');
  });

  // Test 7: Reset endpoint
  await test('POST /api/reset should reset tasks', async () => {
    const res = await makeRequest('POST', '/api/reset');
    assertEqual(res.status, 200, 'Reset status');
    if (!Array.isArray(res.body.tasks)) {
      throw new Error('Reset did not return tasks array');
    }
  });

  // Test 8: Full workflow
  await test('Complete workflow: create -> read -> update', async () => {
    // Reset first
    await makeRequest('POST', '/api/reset');

    // Create
    const createRes = await makeRequest('POST', '/api/tasks', {
      title: 'Workflow Test'
    });
    assertEqual(createRes.status, 201, 'Workflow create status');
    const taskId = createRes.body.id;

    // Read
    const readRes = await makeRequest('GET', `/api/tasks/${taskId}`);
    assertEqual(readRes.status, 200, 'Workflow read status');
    assertEqual(readRes.body.title, 'Workflow Test', 'Workflow title match');

    // Update
    const updateRes = await makeRequest('PUT', `/api/tasks/${taskId}`, {
      completed: true
    });
    assertEqual(updateRes.status, 200, 'Workflow update status');
    assertEqual(updateRes.body.completed, true, 'Workflow completed');
  });

  console.log('\n=== E2E Tests Complete ===');
  console.log(`\nPassed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}\n`);

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('✓ All tests passed!\n');
    process.exit(0);
  }
}

// Wait for app to be ready
async function waitForApp() {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const res = await makeRequest('GET', '/health');
      if (res.status === 200) {
        console.log('✓ App is ready\n');
        return;
      }
    } catch (error) {
      // App not ready yet
    }
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.error('✗ App failed to start after 30 seconds');
  process.exit(1);
}

// Run everything
waitForApp().then(() => runTests());
