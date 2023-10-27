import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { CategoriesModule } from '../../src/categories/categories.module';
import { ProductModule } from '../../src/product/product.module';
import { createCategory, createProduct, startMongoContainer, stopMongoContainer } from './test-helpers';


let app: INestApplication;

const mockJwtService = {
  verify: jest.fn().mockImplementation((token) => ({
    id: 'some-mocked-user-id',
    roles: ['admin']
  })),
};
const ERROR_MSG = {
  BAD_REQUEST_ERROR: 'Bad Request',
  NOT_FOUND_ERROR: 'Not Found',
  ELEMENT_NOT_FOUND_MESSAGE: 'The element not found in database.',
}

describe('SearchController (e2e)', () => {
  let mongoUri;
  beforeAll(async () => {
    jest.setTimeout(60000);

    mongoUri = await startMongoContainer();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoUri, { autoCreate: true }),

        AppModule, ProductModule, CategoriesModule],
      providers: [
        JwtService,
      ]
    })
      .overrideProvider(JwtService).useValue(mockJwtService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));


    await app.init();
  }, 60000);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/search/:collection/:term', () => {

    it('should return products based on valid term', async () => {
      const product = await createProduct(app);

      const response = await request(app.getHttpServer())
        .get(`/search/product/${product.createdEntity.name}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
    });

    it('should return categories based on valid term', async () => {
      const category = await createCategory(app);

      const response = await request(app.getHttpServer())
        .get(`/search/categories/${category.createdEntity._id}`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

    });

    it('should handle not allowed collections', async () => {
      const allowedCollections = ['product', 'categories'];

      const response = await request(app.getHttpServer())
        .get('/search/notAllowedCollection/someTerm')
        .expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: `Allowed collections are ${allowedCollections}`, // según tu implementación actual
        error: ERROR_MSG.BAD_REQUEST_ERROR
      });
    });

    it('should Not Found is term is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/search/product/')
        .expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: `Cannot GET /search/product/`,
        error: ERROR_MSG.NOT_FOUND_ERROR
      });
    });

    afterAll(async () => {
      await stopMongoContainer();
      await app.close();
    })

  });
});