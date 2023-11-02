import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { Document } from "mongoose";

export type ProductDocument = Product & Document;

@Schema()
export class Product {

  @ApiProperty({ example: '6522b214dbabfa715eb97177', description: 'Product Id'})
    @Prop()
    id: string;

  @ApiProperty({ example: 'Oros', description: 'Name of the Product'})
    @Prop({
        required: true,
        unique: true
    })
    name: string;

  @ApiProperty({ example: '20.5', type: 'number', description: 'Product price'})
   @Prop({
    default:10
   })
    price: number;

  @ApiProperty({ example: 'Chocolat cookies', description: 'Description of the Product'})
   @Prop()
    description: string;

  @ApiProperty({ example: '20', type: Number, description: 'Products in stock'})
    @Prop({
        default:0
    })
    stock: number;

    @ApiProperty({ example: ['300g','500g'],type: [String], description:'Sizes of products' })
    @Prop([String])
    sizes: string[];

    @ApiProperty({ enum: ['men', 'women', 'kid', 'unisex']})
    @Prop()
    gender: string;

    @ApiProperty({ example: ['#cookies','#chocolat'],type: [String], description:'Tags of products' })
    @Prop([String])
    tags: string[];

    @Prop()
    userId:string;

    @ApiProperty({ example: '6522b214dbabfa715eb97177', description: 'The category id to assign the product created'})
    @Prop({type:mongoose.Schema.Types.ObjectId, ref: 'Category'})
    categoryId:string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.methods.toJSON = function() {
    const { __v, ...data  } = this.toObject();
    return data;
}
