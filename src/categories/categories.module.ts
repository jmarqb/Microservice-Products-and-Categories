import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { CommonModule } from '../common/common.module';
import { EventsModule } from '../event/event.module';

@Module({
  imports:[
   
    MongooseModule.forFeature([{ name: Category.name , schema: CategorySchema}]),

    CommonModule,

    EventsModule
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }])]
})
export class CategoriesModule {}
