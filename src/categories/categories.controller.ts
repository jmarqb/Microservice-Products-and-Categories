import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { JwtAdminGuard } from '../common/auth/guards/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Category } from './entities/category.entity';
import { PaginatedResult, RequestWithUser } from '../common/interfaces/paginated-result.interface';
import { ValidateMongoIdPipe } from '../common/pipes/validate-object-id.pipe';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Insert a new Category' })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of a category inserted.',
    type: Category,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  create(@Req() request: RequestWithUser, @Body() createCategoryDto: CreateCategoryDto) {
    createCategoryDto.userId = request.userId;
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of Categories with optional pagination.' })
  @ApiResponse({status:200, description: 'Get Categories'})
  @UseGuards(JwtAdminGuard)
  findAll(@Query() paginationDto:PaginationDto): Promise<PaginatedResult<Category>> {
    return this.categoriesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Category for ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Category.',
    type: Category,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  findOne(@Param('id', new ValidateMongoIdPipe()) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Category' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Category',
    type: Category,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  update(@Param('id', new ValidateMongoIdPipe()) id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Category ' })
  @ApiResponse({status: 200})
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  remove(@Param('id', new ValidateMongoIdPipe()) id: string) {
    return this.categoriesService.remove(id);
  }
}
