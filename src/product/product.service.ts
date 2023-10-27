import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter } from 'events';
import { Model } from 'mongoose';

import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class ProductService {

  constructor(
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {
    this.eventEmitter.on('CATEGORY_DELETED', this.handleCategoryDeleted.bind(this))
   }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    createProductDto.name = createProductDto.name.charAt(0).toUpperCase() + createProductDto.name.slice(1);

    try {
      const product = await this.productModel.create(createProductDto);

      this.eventEmitter.emit('PRODUCT_CREATED', {
        productId: product._id.toString(),
        categoryId: createProductDto.categoryId
      });

      return product;

    } catch (error) {
      this.handlerDbErrors(error.code)
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Product>> {
    const { limit = 10, offset = 0 } = paginationDto;

    const products = await this.productModel.find()
      .populate('categoryId', '-__v -productId')
      .skip(Number(offset))
      .limit(Number(limit))
      .exec();

    const total = await this.productModel.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return {
      items: products,
      total: total,
      currentPage: offset / limit + 1,
      totalPages: totalPages
    };

  }

  async findOne(id: string): Promise<Product> {

    try {
      const product = await this.productModel.findById(id);

      if (!product) {
        throw new NotFoundException(`The product with the id ${id} not exists in database`);
      }
      return product;

    } catch (error) {
      this.handlerDbErrors(error.status)
    }

  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.findOne(id);
    if(updateProductDto.name){
      updateProductDto.name = updateProductDto.name.charAt(0).toUpperCase() + updateProductDto.name.slice(1);
    }
    const updatedProduct = await this.productModel.findOneAndUpdate(product, updateProductDto, { new: true });

    this.eventEmitter.emit('PRODUCT_CREATED', {
      productId: updatedProduct._id.toString(),
      categoryId: updateProductDto.categoryId
    });
    return updatedProduct;
  }

  async remove(id: string) {

    try {
      const product = await this.productModel.findByIdAndRemove(id);

      if (!product) {
        throw new NotFoundException(`The product with the id ${id} not exists in database`);
      }

      this.eventEmitter.emit('PRODUCT_DELETED', { productId: id });


    } catch (error) {
      this.handlerDbErrors(error.status)
    }
  }

  private handlerDbErrors(error: any) {

    switch (error) {
      case 11000:
        this.logger.error('Duplicate Key.', error.detail);
        throw new BadRequestException('The element already exists in database.');

      case 404:
        this.logger.error('Not Found.', error.detail);
        throw new NotFoundException('The element not found in database.');

      default:
        this.logger.error('Error Unknow in database.', error);
        throw new InternalServerErrorException('Please check server logs.');
    }

  }

  private async handleCategoryDeleted(eventData: { categoryId: any }) {
    const { categoryId } = eventData;
    try {
        await this.productModel.updateMany({ categoryId }, { $unset: { categoryId: "" } });
    } catch (err) {
        console.error('Error updating products after category deletion:', err);
    }
}

}