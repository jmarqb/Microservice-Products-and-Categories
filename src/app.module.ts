import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { CategoriesModule } from './categories/categories.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './common/auth/auth.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [

    
    MongooseModule.forRoot(process.env.MONGODB_CNN, {
      autoCreate:true,
    }),

    AuthModule,

    ProductModule,

     CategoriesModule,

     SearchModule

    ],
})
export class AppModule {}
