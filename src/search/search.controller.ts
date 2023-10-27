import { Controller, Get, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Search')
@Controller('search')
export class SearchController{

    constructor(
        private readonly searchService: SearchService
    ){}

@Get('/:collection/:terms')
@ApiOperation({ summary: 'Find a Products or Categories' })
@ApiResponse({
  status: 200,
  description: 'Returns the details of a Products or Categories',
})
@ApiResponse({status:400, description: 'Bad Request'})
@ApiParam({ name: 'collection', description: 'Name of the collection', type: String })
@ApiParam({ name: 'terms', description: 'Search terms', type: String })
find(@Param() params: {collection:string, terms:any}){
    return this.searchService.search(params.collection, params.terms);
}
}