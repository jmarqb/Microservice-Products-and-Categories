import { Request, Response, NextFunction } from 'express';
import { BadRequestException, Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../categories/entities/category.entity';

@Injectable()
export class ValidateCategoryMiddleware implements NestMiddleware {
    
    constructor(
        @InjectModel(Category.name) private readonly categoryModel: Model<Category>
    ) { }

    async use(req: Request, res: Response, next: NextFunction) {

        const { categoryId } = req.body;

        if (categoryId) {
            if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
                throw new BadRequestException('Invalid category ID format');
            }

            const category = await this.categoryModel.findById(categoryId);
            if (!category) {
                throw new NotFoundException(`Category with ID ${categoryId} not found`);

            }
        }
        next();
    }
}
