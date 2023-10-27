
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import * as request from 'supertest';
import { EventEmitter } from 'events';

import { AppModule } from '../../src/app.module';
import { CategoriesModule } from '../../src/categories/categories.module';
import { ProductModule } from '../../src/product/product.module';
import { createCategory,createProduct,startMongoContainer, stopMongoContainer } from './test-helpers';


const mockEventEmitter1 = {
    emit: jest.fn(),
    on: jest.fn()
};
let app: INestApplication;
const mockJwtService = {
    verify: jest.fn().mockImplementation((token) => ({
        id: 'some-mocked-user-id',
        roles: ['admin']
    })),
};
const ERROR_MSG = {
    UNAUTHORIZED_ERROR: 'Unauthorized',
    UNAUTHORIZED_MESSAGE: 'Access unauthorized',
    BAD_REQUEST_ERROR: 'Bad Request',
    INVALID_MONGODB_ID_MESSAGE: 'Invalid MongoDB Id',
    NOT_FOUND_ERROR: 'Not Found',
    ELEMENT_NOT_FOUND_MESSAGE: 'The element not found in database.',
    ELEMENT_DUPLICATE_MESSAGE: 'The element already exists in database.'
}
describe('ProductController (e2e)', () => {
    let mongoUri;

    beforeAll(async () => {
        jest.setTimeout(60000);

         console.log('Starting MongoDBContainer container...');
        mongoUri = await startMongoContainer();


        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                    MongooseModule.forRoot(mongoUri, { autoCreate: true }),

                AppModule, ProductModule, CategoriesModule],
            providers: [
                JwtService,
            ]
        }).overrideProvider(JwtService).useValue(mockJwtService)
            .overrideProvider(EventEmitter).useValue(mockEventEmitter1)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));


        await app.init();
    }, 60000);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe('/product (POST)', () => {

      
        it('should create a product and emit event', async () => {
    
          const response = await createProduct(app);
    
          expect(response.status).toBe(201)
          expect(response.createdEntity).toHaveProperty('name')
          expect(response.createdEntity).toHaveProperty('price')
          expect(response.createdEntity).toHaveProperty('stock')
          expect(response.createdEntity).toHaveProperty('sizes')
          expect(response.createdEntity.sizes).toBeInstanceOf(Array)
          expect(response.createdEntity).toHaveProperty('gender')
          expect(response.createdEntity).toHaveProperty('tags')
          expect(response.createdEntity.tags).toBeInstanceOf(Array)
          expect(response.createdEntity).toHaveProperty('userId')
          expect(response.createdEntity).toHaveProperty('categoryId')
          expect(response.createdEntity).toHaveProperty('_id')
    
          expect(mockEventEmitter1.emit).toHaveBeenCalledWith('PRODUCT_CREATED', {
            productId: response.createdEntity._id.toString(),
            categoryId: response.createdEntity.categoryId
          });
        });
    
        it('should unauthorized if not exist a token', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": category.createdEntity._id
            })
            .expect(401)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.UNAUTHORIZED_ERROR)
              expect(res.body.message).toBe(ERROR_MSG.UNAUTHORIZED_MESSAGE)
            });
        });
    
        it('should BadRequest if send a empty data', async () => {
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
            })
        });
    
        it('should BadRequest if not send sizes', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "gender": "unisex",
              "categoryId": category.createdEntity._id
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
            })
        });
    
        it('should BadRequest if not send a name', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": category.createdEntity._id
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
            })
        });
    
        it('should BadRequest if not send gender', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "categoryId": category.createdEntity._id
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
            })
        });
    
        it('should BadRequest if not send a categoryId', async () => {
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "gender": "unisex",
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
            })
        });
    
        it('should Not Found if is a non exist categoryid', async () => {
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": '6533af85dbabfa715eb97171'
            })
            .expect(404)
            .expect((res) => {
              expect(res.body.error).toBe('Not Found')
              expect(res.body.message).toBe('Category with ID 6533af85dbabfa715eb97171 not found')
            })
        });
    
        it('should BadRequest if is a invalid categoryid', async () => {
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": 'invalidId'
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
              expect(res.body.message).toBe('Invalid category ID format')
            })
        });
    
        it('should BadRequest if field sizes not an array', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": "l",
              "gender": "unisex",
              "categoryId": category.createdEntity._id
    
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
              expect(res.body.message[0]).toBe('sizes must be an array')
            })
        });
        it('should BadRequest if field name have a number value', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': 5,
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": category.createdEntity._id
    
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
              expect(res.body.message[1]).toBe('name must be a string')
            })
        });
    
        it('should BadRequest if gender not allowed', async () => {
    
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              'name': `product${new Date().getTime()}`,
              "sizes": ["XL", "l"],
              "gender": 45,
              "categoryId": category.createdEntity._id
    
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR)
              expect(res.body.message[0]).toBe('gender must be one of the following values: men, women, kid, unisex')
            })
        });
    
        it('should not allow duplicated product', async () => {
          const category = await createCategory(app);
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "name": "newProduct",
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": category.createdEntity._id
            })
            .expect(201)
    
          await request(app.getHttpServer())
            .post('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "name": "newProduct",
              "sizes": ["XL", "l"],
              "gender": "unisex",
              "categoryId": category.createdEntity._id
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.message).toBe(ERROR_MSG.ELEMENT_DUPLICATE_MESSAGE)
            });
        });
    
    
    });
    
      describe('/product (GET)', () => {
        it('should respond with paginated products', async () => {
          await request(app.getHttpServer())
            .get('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200)
            .expect((res) => {
              expect(res.body).toHaveProperty('items');
              expect(res.body).toHaveProperty('total');
              expect(res.body).toHaveProperty('currentPage');
              expect(res.body).toHaveProperty('totalPages');
    
              expect(res.body.items).toBeInstanceOf(Array);
              expect(res.body.items[0]).toHaveProperty('_id');
              expect(res.body.items[0]).toHaveProperty('name');
              expect(res.body.items[0]).toHaveProperty('price');
              expect(res.body.items[0]).toHaveProperty('stock');
              expect(res.body.items[0]).toHaveProperty('sizes');
              expect(res.body.items[0]).toHaveProperty('gender');
              expect(res.body.items[0]).toHaveProperty('tags');
              expect(res.body.items[0]).toHaveProperty('userId');
              expect(res.body.items[0]).toHaveProperty('categoryId');
              expect(res.body.items[0].tags).toBeInstanceOf(Array);
              expect(res.body.items[0].sizes).toBeInstanceOf(Array);
            });
        });
    
        it('should respond with an array of products', async () => {
          await request(app.getHttpServer())
            .get('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200)
            .expect((res) => {
              expect(res.body.items).toBeInstanceOf(Array);
            });
        });
    
        it('should respect the limit and offset parameters', async () => {
    
          for (let i = 0; i <= 11; i++) {
            //create a product in database
            await createProduct(app);
          }
    
          await request(app.getHttpServer())
            .get('/product?limit=5&offset=5')
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200)
            .expect((res) => {
              expect(res.body.items.length).toBe(5);
            });
        });
    
        it('should respect the provided limit', async () => {
          const limit = 5;
          const response = await request(app.getHttpServer())
            .get(`/product?limit=${limit}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200);
    
          expect(response.body.items.length).toBeLessThanOrEqual(limit);
        });
    
        it('should respect the provided offset', async () => {
          for (let i = 0; i <= 11; i++) {
            //create a product in database
            await createProduct(app);
          }
    
          const limit = 5;
          const offset = 5;
    
          const firstResponse = await request(app.getHttpServer())
            .get(`/product?limit=${limit}&offset=${offset}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200);
    
          const secondResponse = await request(app.getHttpServer())
            .get(`/product?limit=${limit}&offset=${offset + limit}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200);
    
          expect(firstResponse.body.items[0]._id).not.toBe(secondResponse.body.items[0]._id);
        });
    
        it('should return the correct total count and pages', async () => {
          const limit = 5;
          const response = await request(app.getHttpServer())
            .get(`/product?limit=${limit}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200);
    
          expect(response.body.total).toBeDefined();
          expect(response.body.totalPages).toBeDefined();
          expect(response.body.totalPages).toBe(Math.ceil(response.body.total / limit));
        });
    
        it('should use default values if limit and offset are not provided', async () => {
          const response = await request(app.getHttpServer())
            .get('/product')
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200);
    
          expect(response.body.items.length).toBeLessThanOrEqual(10); // default limit
          expect(response.body.currentPage).toBe(1); // default page
        });
      });
    
      describe('/product/:id (GET)', () => {
        it('should retrieve a product by its id', async () => {
          //create a product in database
          const response = await createProduct(app);
    
          await request(app.getHttpServer())
            .get(`/product/${response.createdEntity._id}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200)
            .expect((res) => {
              expect(res.body).toHaveProperty('_id');
              expect(res.body._id).toBe(response.createdEntity._id);
              expect(res.body).toHaveProperty('name');
              expect(res.body).toHaveProperty('price');
              expect(res.body).toHaveProperty('stock');
              expect(res.body).toHaveProperty('sizes');
              expect(res.body).toHaveProperty('gender');
              expect(res.body).toHaveProperty('tags');
              expect(res.body).toHaveProperty('userId');
              expect(res.body).toHaveProperty('categoryId');
              expect(res.body.sizes).toBeInstanceOf(Array);
              expect(res.body.tags).toBeInstanceOf(Array);
            });
        });
    
        it('should return bad request if id is not a valid MongoId', async () => {
          const invalidId = 'some-invalidId';
          await request(app.getHttpServer())
          .get(`/product/${invalidId}`)
          .set('Authorization', 'Bearer any-fake-token-value')
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
            });
        });
    
        it('should return not found if product does not exist', async () => {
          const nonExistingProductId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
          await request(app.getHttpServer())
            .get(`/product/${nonExistingProductId}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(404)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.NOT_FOUND_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.ELEMENT_NOT_FOUND_MESSAGE);
            });
        });
      });
    
      describe('/product/:id (PATCH)', () => {
        it('should unauthorized if not exist a token', async () => {
    
          //create a product in database
          const response = await createProduct(app);
    
          await request(app.getHttpServer())
            .patch(`/product/${response.createdEntity._id}`)
            .send({
              "name": "updateProduct",
            })
            .expect(401)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.UNAUTHORIZED_ERROR)
              expect(res.body.message).toBe(ERROR_MSG.UNAUTHORIZED_MESSAGE)
            });
        });
    
        it('should return bad request if id is not a valid MongoId', async () => {
          const invalidId = 'some-invalidId';
          await request(app.getHttpServer())
            .patch(`/product/${invalidId}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "name": "UpdatedProduct",
            })
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
            });
        });
    
        it('should return not found if product does not exist', async () => {
          const nonExistingProductId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
          await request(app.getHttpServer())
            .patch(`/product/${nonExistingProductId}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "name": "UpdateProduct",
            })
            .expect(404)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.NOT_FOUND_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.ELEMENT_NOT_FOUND_MESSAGE);
            });
    
        });
    
        it('should Updated Product and emit event', async () => {
          //create a product
          const response = await createProduct(app);
    
          const updProd = await request(app.getHttpServer())
            .patch(`/product/${response.createdEntity._id}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .send({
              "name": "UpdateProduct",
            })
            .expect(200)
          expect(updProd.body).toHaveProperty('_id');
          expect(updProd.body).toHaveProperty('name');
          expect(updProd.body).toHaveProperty('price');
          expect(updProd.body).toHaveProperty('stock');
          expect(updProd.body).toHaveProperty('sizes');
          expect(updProd.body.sizes).toBeInstanceOf(Array);
          expect(updProd.body).toHaveProperty('gender');
          expect(updProd.body).toHaveProperty('tags');
          expect(updProd.body.tags).toBeInstanceOf(Array);
          expect(updProd.body).toHaveProperty('userId');
          expect(updProd.body).toHaveProperty('categoryId');
    
          expect(mockEventEmitter1.emit).toHaveBeenCalledWith('PRODUCT_CREATED', {
            productId: updProd.body._id.toString(),
            categoryId: response.createdEntity.categoryId
          });
    
        });
    
      });
    
      describe('/product/:id (DELETE)', () => {
    
        it('should deleted product', async () => {
          //create a product
          const response = await createProduct(app);
    
          await request(app.getHttpServer())
            .delete(`/product/${response.createdEntity._id}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(200)
    
          expect(mockEventEmitter1.emit).toHaveBeenCalledWith('PRODUCT_DELETED', {
            productId: response.createdEntity._id
          });
        });
    
        it('should unauthorized if not exist a token', async () => {
    
          //create a product in database
          const response = await createProduct(app);
          await request(app.getHttpServer())
            .delete(`/product/${response.createdEntity._id}`)
            .expect(401)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.UNAUTHORIZED_ERROR)
              expect(res.body.message).toBe(ERROR_MSG.UNAUTHORIZED_MESSAGE)
            });
        });
    
        it('should return bad request if id is not a valid MongoId', async () => {
          const invalidId = 'some-invalidId';
          await request(app.getHttpServer())
            .delete(`/product/${invalidId}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(400)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
            });
        });
    
        it('should return not found if product does not exist', async () => {
          const nonExistingProductId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
          await request(app.getHttpServer())
            .delete(`/product/${nonExistingProductId}`)
            .set('Authorization', 'Bearer any-fake-token-value')
            .expect(404)
            .expect((res) => {
              expect(res.body.error).toBe(ERROR_MSG.NOT_FOUND_ERROR);
              expect(res.body.message).toBe(ERROR_MSG.ELEMENT_NOT_FOUND_MESSAGE);
            });
    
        });
    
      });

  afterAll(async () => {
    await stopMongoContainer();
    await app.close();

  });
});
