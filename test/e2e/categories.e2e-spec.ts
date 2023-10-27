
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import * as request from 'supertest';
import { EventEmitter } from 'events';

import { AppModule } from '../../src/app.module';
import { CategoriesModule } from '../../src/categories/categories.module';
import { ProductModule } from '../../src/product/product.module';
import { createCategory,startMongoContainer, stopMongoContainer } from './test-helpers';

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

describe('CategoriesController (e2e)', () => {
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
            .overrideProvider(EventEmitter).useValue(mockEventEmitter1)
            .compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
        await app.init();
    }, 60000);

    beforeEach(() => {
            jest.clearAllMocks();
          });

    //TESTS >>>>>>>> CATEGORIES
    describe('/categories (POST)', () => {
        it('should create a category', async () => {
            const response = await createCategory(app);
            expect(response.status).toBe(201);
            expect(response.createdEntity).toHaveProperty('_id')
            expect(response.createdEntity).toHaveProperty('name')
            expect(response.createdEntity).toHaveProperty('userId')
            expect(response.createdEntity).toHaveProperty('productId')
        });

        it('should unauthorized if not exist a token', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .send({
                    "name": "newCategoryTwo",
                })
                .expect(401)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.UNAUTHORIZED_ERROR)
                    expect(res.body.message).toBe(ERROR_MSG.UNAUTHORIZED_MESSAGE)
                });
        });
       
        

        it('should BadRequest if send a empty data', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                })
                .expect(400)
        });
        it('should BadRequest if send a number value', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    'name': 5
                })
                .expect(400)
        });
        it('should not allow duplicated categories', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    "name": "newCategory",
                })
                .expect(201)

            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    "name": "newCategory",
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.message).toBe(ERROR_MSG.ELEMENT_DUPLICATE_MESSAGE)
                });
        });
    });

    describe('/categories (GET)', () => {
        it('should respond with paginated categories', async () => {
            await request(app.getHttpServer())
                .get('/categories')
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
                    expect(res.body.items[0]).toHaveProperty('userId');
                    expect(res.body.items[0]).toHaveProperty('productId');
                    expect(res.body.items[0].productId).toBeInstanceOf(Array);
                });
        });

        it('should respond with an array of categories', async () => {
            await request(app.getHttpServer())
            .get('/categories')
            .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toBeInstanceOf(Array);
                });
        });

        it('should respect the limit and offset parameters', async () => {

            for (let i = 0; i <= 11; i++) {
                //create a categories in database
                await createCategory(app);
            }

            await request(app.getHttpServer())
                .get('/categories?limit=5&offset=5')
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200)
                .expect((res) => {
                    expect(res.body.items.length).toBe(5);
                });
        });

        it('should respect the provided limit', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/categories?limit=${limit}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(limit);
        });

        it('should respect the provided offset', async () => {
            for (let i = 0; i <= 11; i++) {
                //create a categories in database
                await createCategory(app);
            }

            const limit = 5;
            const offset = 5;

            const firstResponse = await request(app.getHttpServer())
                .get(`/categories?limit=${limit}&offset=${offset}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200);

            const secondResponse = await request(app.getHttpServer())
                .get(`/categories?limit=${limit}&offset=${offset + limit}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200);

            expect(firstResponse.body.items[0]._id).not.toBe(secondResponse.body.items[0]._id);
        });

        it('should return the correct total count and pages', async () => {
            const limit = 5;
            const response = await request(app.getHttpServer())
                .get(`/categories?limit=${limit}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200);

            expect(response.body.total).toBeDefined();
            expect(response.body.totalPages).toBeDefined();
            expect(response.body.totalPages).toBe(Math.ceil(response.body.total / limit));
        });

        it('should use default values if limit and offset are not provided', async () => {
            const response = await request(app.getHttpServer())
                .get('/categories')
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200);

            expect(response.body.items.length).toBeLessThanOrEqual(10); // default limit
            expect(response.body.currentPage).toBe(1); // default page
        });
    });

    describe('/categories/:id (GET)', () => {
        it('should retrieve a category by its id', async () => {
            //create a categories in database
            const response = await createCategory(app);

            await request(app.getHttpServer())
                .get(`/categories/${response.createdEntity._id}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('_id');
                    expect(res.body._id).toBe(response.createdEntity._id);
                    expect(res.body).toHaveProperty('name');
                    expect(res.body).toHaveProperty('userId');
                    expect(res.body).toHaveProperty('productId');
                    expect(res.body.productId).toBeInstanceOf(Array);
                });
        });

        it('should return bad request if id is not a valid MongoId', async () => {
            const invalidId = 'some-invalidId';
            await request(app.getHttpServer())
                .get(`/categories/${invalidId}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
                    expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
                });
        });

        it('should return not found if category does not exist', async () => {
            const nonExistingCategoryId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
            await request(app.getHttpServer())
                .get(`/categories/${nonExistingCategoryId}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.NOT_FOUND_ERROR);
                    expect(res.body.message).toBe(ERROR_MSG.ELEMENT_NOT_FOUND_MESSAGE);
                });
        });
    });

    describe('/categories/:id (PATCH)', () => {
        it('should unauthorized if not exist a token', async () => {

            //create a categories in database
            const response = await createCategory(app);

            await request(app.getHttpServer())
                .patch(`/categories/${response.createdEntity._id}`)
                .send({
                    "name": "updateCategory",
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
                .patch(`/categories/${invalidId}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    "name": "UpdatedCategory",
                })
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
                    expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
                });
        });

        it('should return not found if category does not exist', async () => {
            const nonExistingCategoryId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
            await request(app.getHttpServer())
                .patch(`/categories/${nonExistingCategoryId}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    "name": "UpdateCategory",
                })
                .expect(404)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.NOT_FOUND_ERROR);
                    expect(res.body.message).toBe(ERROR_MSG.ELEMENT_NOT_FOUND_MESSAGE);
                });

        });

        it('should Updated Category', async () => {
            //create a category
            const response = await createCategory(app);

            await request(app.getHttpServer())
                .patch(`/categories/${response.createdEntity._id}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .send({
                    "name": "UpdateCategory",
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('_id');
                    expect(res.body).toHaveProperty('name');
                    expect(res.body).toHaveProperty('userId');
                    expect(res.body).toHaveProperty('productId');
                    expect(res.body.productId).toBeInstanceOf(Array);
                });

        });

    });

    describe('/categories/:id (DELETE)', () => {

        it('should deleted category', async () => {
            //create a category
            const response = await createCategory(app);

            await request(app.getHttpServer())
                .delete(`/categories/${response.createdEntity._id}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(200)

            expect(mockEventEmitter1.emit).toHaveBeenCalledWith('CATEGORY_DELETED', {
                categoryId: response.createdEntity._id
            });
        });

        it('should unauthorized if not exist a token', async () => {

            //create a categories in database
            const response = await createCategory(app);
            await request(app.getHttpServer())
                .delete(`/categories/${response.createdEntity._id}`)
                .expect(401)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.UNAUTHORIZED_ERROR)
                    expect(res.body.message).toBe(ERROR_MSG.UNAUTHORIZED_MESSAGE)
                });
        });

        it('should return bad request if id is not a valid MongoId', async () => {
            const invalidId = 'some-invalidId';
            await request(app.getHttpServer())
                .delete(`/categories/${invalidId}`)
                .set('Authorization', 'Bearer any-fake-token-value')
                .expect(400)
                .expect((res) => {
                    expect(res.body.error).toBe(ERROR_MSG.BAD_REQUEST_ERROR);
                    expect(res.body.message).toBe(ERROR_MSG.INVALID_MONGODB_ID_MESSAGE);
                });
        });

        it('should return not found if category does not exist', async () => {
            const nonExistingCategoryId = '6522b214dbabfa715eb97176'; //This MongoId not EXists
            await request(app.getHttpServer())
                .delete(`/categories/${nonExistingCategoryId}`)
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
