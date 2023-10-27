import { GenericContainer } from 'testcontainers';
import * as request from 'supertest';

let mongodbContainer;
export async function startMongoContainer() {
  if (!mongodbContainer) { // Only start the container if not yet executed
    console.log('Starting MongoDBContainer container...');

    const mongoContainer = new GenericContainer("mongo:6.0.1");
    mongodbContainer = await mongoContainer.withExposedPorts(27017).start();
    
    const port = mongodbContainer.getMappedPort(27017);
    const mongoUri = `mongodb://${mongodbContainer.getHost()}:${port}/database_products_service`;

    return mongoUri;
  } else {
    console.log('MongoDBContainer container already running.');
    const port = mongodbContainer.getMappedPort(27017);
    return `mongodb://${mongodbContainer.getHost()}:${port}/database_products_service`;
  }
}

export async function stopMongoContainer() {
  if (mongodbContainer) {
    await mongodbContainer.stop();
    mongodbContainer = null; // Clean the instance after stop 
    console.log('Container stopped.');
  }
}




export async function createEntity(app, url: string, data: any, token: string = 'Bearer any-fake-token-value') {
    let createdEntity;
    let status;

    await request(app.getHttpServer())
      .post(url)
      .set('Authorization', token)
      .send(data)
      .expect((res) => {
        createdEntity = res.body;
        status = res.statusCode;
      });

    return { createdEntity, status };
}

export async function createCategory(app) {
    const data = {
      'name': `category${new Date().getTime()}`,
    };
    return createEntity(app, '/categories', data);
}

export async function createProduct(app) {
    const category = await createCategory(app);
    const data = {
      'name': `product${new Date().getTime()}`,
      "sizes": ["XL", "l"],
      "gender": "unisex",
      "categoryId": category.createdEntity._id
    };
    return createEntity(app, '/product', data);
}
