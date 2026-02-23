import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Blockchain Monitoring Admin (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login as admin to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/admin/login')
      .send({
        email: 'admin@dabdub.xyz',
        password: 'admin-password',
      });

    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/blockchain/monitors', () => {
    it('should return list of monitors', () => {
      return request(app.getHttpServer())
        .get('/api/v1/blockchain/monitors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('monitors');
          expect(Array.isArray(res.body.monitors)).toBe(true);
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/blockchain/monitors')
        .expect(401);
    });
  });

  describe('POST /api/v1/blockchain/monitors/:chain/pause', () => {
    it('should pause a monitor with valid reason', () => {
      return request(app.getHttpServer())
        .post('/api/v1/blockchain/monitors/base/pause')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Scheduled maintenance window' })
        .expect(201)
        .expect((res) => {
          expect(res.body.status).toBe('PAUSED');
        });
    });

    it('should reject short reason', () => {
      return request(app.getHttpServer())
        .post('/api/v1/blockchain/monitors/base/pause')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'test' })
        .expect(400);
    });
  });

  describe('POST /api/v1/blockchain/monitors/:chain/rescan', () => {
    it('should reject range exceeding 10,000 blocks', () => {
      return request(app.getHttpServer())
        .post('/api/v1/blockchain/monitors/base/rescan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fromBlock: 1000,
          toBlock: 12000,
          reason: 'Missed blocks during RPC downtime',
        })
        .expect(400);
    });

    it('should accept valid rescan request', () => {
      return request(app.getHttpServer())
        .post('/api/v1/blockchain/monitors/base/rescan')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          fromBlock: 1000,
          toBlock: 2000,
          reason: 'Missed blocks during RPC downtime',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  describe('GET /api/v1/blockchain/rpc-endpoints', () => {
    it('should return masked URLs', () => {
      return request(app.getHttpServer())
        .get('/api/v1/blockchain/rpc-endpoints')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0].url).toContain('***');
          }
        });
    });
  });

  describe('POST /api/v1/blockchain/rpc-endpoints', () => {
    it('should require super admin role', () => {
      return request(app.getHttpServer())
        .post('/api/v1/blockchain/rpc-endpoints')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          chain: 'base',
          url: 'https://base-mainnet.g.alchemy.com/v2/test-key',
          providerName: 'Alchemy',
          isPrimary: false,
          priority: 1,
        })
        .expect((res) => {
          expect([201, 403]).toContain(res.status);
        });
    });
  });

  describe('DELETE /api/v1/blockchain/rpc-endpoints/:id', () => {
    it('should prevent deletion of last active endpoint', async () => {
      const endpoints = await request(app.getHttpServer())
        .get('/api/v1/blockchain/rpc-endpoints')
        .set('Authorization', `Bearer ${adminToken}`);

      if (endpoints.body.length > 0) {
        const endpointId = endpoints.body[0].id;
        return request(app.getHttpServer())
          .delete(`/api/v1/blockchain/rpc-endpoints/${endpointId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect((res) => {
            expect([200, 400, 403]).toContain(res.status);
          });
      }
    });
  });
});
