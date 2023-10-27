import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Model,Types } from "mongoose";

import { Product } from "../product/entities/product.entity";
import { Category } from "../categories/entities/category.entity";

@Injectable()
export class SearchService {

    private allowedCollections: string[] = ['product', 'categories']

    constructor(
        @InjectModel(Product.name)
        private readonly productModel: Model<Product>,

        @InjectModel(Category.name)
        private readonly categoriesModel: Model<Category>
    ) {}

    private async searchProduct(term: string): Promise<Product[]> {
        const { ObjectId } = Types;

        if (ObjectId.isValid(term)) {
            const product = await this.productModel.findById(term).populate('categoryId', '-__v -productId');
            return product ? [product] : [];
        }

        const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(term);
        if (containsMetaCharacter) {
            throw new BadRequestException(`Syntax error: character ${term} not allowed`);
        }
        const regex = new RegExp(term, 'i');
        return this.productModel.find({ name: regex }).populate('categoryId', 'name');
    }

    private async searchCategory(term: string): Promise<Category[]> {
        const { ObjectId } = Types;

        if (ObjectId.isValid(term)) {
            const category = await this.categoriesModel.findById(term);
            return category ? [category] : [];
        }

        const containsMetaCharacter = /[-\/\\^$*+?.()|[\]{}]/.test(term);
        if (containsMetaCharacter) {
            throw new BadRequestException(`Syntax error: character ${term} not allowed`);
        }
        const regex = new RegExp(term, 'i');
        return this.categoriesModel.find({ name: regex });
    }

    async search(collection: string, term: any) {
        
        if (!this.allowedCollections.includes(collection)) {
            throw new BadRequestException(`Allowed collections are ${this.allowedCollections}`);
        }

        switch (collection) {
            case 'categories':
                return this.searchCategory(term);
            case 'product':
                return this.searchProduct(term);
            default:
                throw new InternalServerErrorException(`You forgot to implement a search for this collection`);
        }
    }
}