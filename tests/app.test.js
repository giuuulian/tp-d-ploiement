const request = require('supertest');
const app = require('../src/app');

describe('API Endpoints', () => {
  beforeEach(async () => {
    // Reset tasks before each test
    await request(app).post('/api/reset');
  });
  
  describe('GET /health', () => {
    it('should return health status with 200', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);
      
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('version');
    });
  });

  describe('GET /api/tasks', () => {
    it('should return array of tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .expect(200);
      
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should have task structure', async () => {
      const res = await request(app)
        .get('/api/tasks');
      
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('title');
        expect(res.body[0]).toHaveProperty('completed');
      }
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = { title: 'New Test Task' };
      const res = await request(app)
        .post('/api/tasks')
        .send(newTask)
        .expect(201);
      
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', 'New Test Task');
      expect(res.body).toHaveProperty('completed', false);
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({})
        .expect(400);
      
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/99999')
        .expect(404);
      
      expect(res.body).toHaveProperty('error');
    });
  });

});
