import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req} from '@nestjs/common';
import { ProductService } from './product.service';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAdminGuard } from '../common/auth/guards/jwt-auth.guard';
import { PaginatedResult, RequestWithUser } from '../common/interfaces/paginated-result.interface';
import { ValidateMongoIdPipe } from '../common/pipes/validate-object-id.pipe';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Product')
@ApiBearerAuth()
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Insert a new Product' })
  @ApiResponse({
    status: 201,
    description: 'Returns the details of a Product inserted.',
    type: Product,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  create(@Req() request: RequestWithUser, @Body() createProductDto: CreateProductDto):Promise<Product> {

    createProductDto.userId = request.userId;
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of Products with optional pagination.' })
  @ApiResponse({status:200, description: 'Get Products'})
  @UseGuards(JwtAdminGuard)
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResult<Product>> {
    return this.productService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find a Product for ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Product.',
    type: Product,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  findOne(@Param('id', new ValidateMongoIdPipe()) id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a Product' })
  @ApiResponse({
    status: 200,
    description: 'Returns the details of a Product',
    type: Product,
  })
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  update(@Param('id', new ValidateMongoIdPipe()) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a Product ' })
  @ApiResponse({status: 200})
  @ApiResponse({status:400, description: 'Bad Request'})
  @ApiResponse({status:401, description: 'Unauthorized'})
  @ApiResponse({status:404, description: 'Not Found'})
  @ApiResponse({status:500, description: 'Internal Server Error'})
  @UseGuards(JwtAdminGuard)
  remove(@Param('id', new ValidateMongoIdPipe()) id: string) {
    return this.productService.remove(id);
  }
}
