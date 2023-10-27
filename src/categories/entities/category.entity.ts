import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { Document } from "mongoose";
import { Product } from "../../product/entities/product.entity";

export type CategoryDocument = Category & Document;

@Schema()
export class Category {

  @ApiProperty({ example: '6522b214dbabfa715eb97177', description: 'The category id'})
    @Prop()
    id: string;

  @ApiProperty({ example: 'Food', description: 'Name of the Category'})
    @Prop({
        required: true,
        unique: true
    })
    name: string;

    @ApiProperty({ 
        example: { userId: 'c589e948-fb91-475c-9043-1b4c05bec680',description: 'The user has created the category' }
    })
    @Prop()
    userId: string;

  @ApiProperty({ example: '6522b214dbabfa715eb97177',type:[Product], description: 'ids to products associated to this category'})
    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }])
    productId: string[];
}

export const CategorySchema = SchemaFactory.createForClass(Category)

CategorySchema.methods.toJSON = function() {
    const { __v, ...data  } = this.toObject();
    return data;
}