import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {EventEmitter} from 'events';
import { Model } from 'mongoose';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

import { PaginationDto } from '../common/dto/pagination.dto';
import { LoggerService } from '../common/logger/logger.service';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectModel(Category.name)
    private readonly categoriesModel: Model<Category>,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter,
  ) {
    this.eventEmitter.on('PRODUCT_CREATED', this.handleProductCreated.bind(this));
    this.eventEmitter.on('PRODUCT_DELETED', this.handleProductDeleted.bind(this))
   }

  async create(createCategoryDto: CreateCategoryDto):Promise<Category> {
    createCategoryDto.name = createCategoryDto.name.charAt(0).toUpperCase() + createCategoryDto.name.slice(1);
    try {
      return await this.categoriesModel.create(createCategoryDto);

    } catch (error) {
        this.handlerDbErrors(error.code);
    }
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResult<Category>> {

    const { limit = 10, offset = 0 } = paginationDto;

    const inj:string = '_id name userId';

    const categories = await this.categoriesModel.find()
      .populate('productId', `${inj}`)
      .skip(Number(offset))
      .limit(Number(limit))
      .exec();

    const total:number = await this.categoriesModel.countDocuments();
    const totalPages:number = Math.ceil(total / limit);

    return {
      items: categories,
      total: total,
      currentPage: offset / limit + 1,
      totalPages: totalPages
    };
  }

  async findOne(id: string): Promise<Category> {
    try {
      const category = await this.categoriesModel.findById(id);

      if (!category) {
        throw new NotFoundException(`The category with the id ${id} not exists in database`);
      }
      return category;

    } catch (error) {
      this.handlerDbErrors(error.status)
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {

    const category = await this.findOne(id);
    if(updateCategoryDto.name){
      updateCategoryDto.name = updateCategoryDto.name.charAt(0).toUpperCase() + updateCategoryDto.name.slice(1);
    }
    const updatedCategory = await this.categoriesModel.findOneAndUpdate(category, updateCategoryDto, { new: true });

    return updatedCategory;
  }

  async remove(id: string) {

    try {
      const category = await this.categoriesModel.findByIdAndRemove(id);

      if (!category) {
        throw new NotFoundException(`The category with the id ${id} not exists in database`);
      }

      this.eventEmitter.emit('CATEGORY_DELETED', { categoryId: id });

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

  private async handleProductCreated(eventData: { productId: any; categoryId: any; }) {
    const { productId, categoryId } = eventData;
    try {
      await this.categoriesModel.findByIdAndUpdate(
          categoryId,
          { $addToSet: { productId: productId } },
          { new: true } 
      );
  } catch (err) {
      console.error('Error updating category with product ID:', err);
  }
}
 
private async handleProductDeleted(eventData: { productId: any }) {
  const { productId } = eventData;
  try {
      await this.categoriesModel.updateMany({ productId }, { $unset: { productId: "" } });
  } catch (err) {
      console.error('Error updating categories after product deletion:', err);
  }
}
}
