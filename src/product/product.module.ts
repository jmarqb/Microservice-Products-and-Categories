import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './entities/product.entity';
import { AuthModule } from '../common/auth/auth.module';
import { CommonModule } from '../common/common.module';
import { CategoriesModule } from '../categories/categories.module';
import { ValidateCategoryMiddleware } from './middlewares/validate-categoryid.middleware';
import { EventsModule } from '../event/event.module';

@Module({
  imports:[
   
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema}]),

    AuthModule,

    CommonModule,

    CategoriesModule,

    EventsModule
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])]

})

export class ProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateCategoryMiddleware)
      .forRoutes(ProductController); 
  }
}
