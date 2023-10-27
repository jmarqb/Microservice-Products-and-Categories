import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { ProductModule } from '../product/product.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
    controllers: [SearchController],
    providers: [SearchService],
    imports:[
        ProductModule,

        CategoriesModule
    ]
})
export class SearchModule { }