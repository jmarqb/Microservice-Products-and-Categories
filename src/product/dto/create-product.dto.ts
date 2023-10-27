import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsMongoId, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator'
export class CreateProductDto {

  @ApiProperty({ example: 'Oros', description: 'Name of the Product'})
    @IsString()
    @MinLength(1)
    name: string;

  @ApiProperty({ example: '20.5', type: 'number', description: 'Product price'})
    @IsNumber()
    @IsPositive()
    @IsOptional()
    price?: number;

  @ApiProperty({ example: 'Chocolat cookies', description: 'Description of the Product'})
    @IsString()
    @IsOptional()
    description?: string;

  @ApiProperty({ example: '20', type: Number, description: 'Products in stock'})
    @IsInt()
    @IsPositive()
    @IsOptional()
    stock?: number;

    @ApiProperty({ example: ['300g','500g'],type: [String], description:'Sizes of products' })
    @IsString({ each: true })
    @IsArray()
    sizes: string[]

    @ApiProperty({ enum: ['men', 'women', 'kid', 'unisex']})
    @IsIn(['men', 'women', 'kid', 'unisex'])
    gender: string;

    @ApiProperty({ example: ['#cookies','#chocolat'],type: [String], description:'Tags of products' })
    @IsString({ each: true })
    @IsArray()
    @IsOptional()
    tags?: string[];

    userId:string;

  @ApiProperty({ example: '6522b214dbabfa715eb97177', description: 'The category id to assign the product created'})
    @IsString()
    @IsMongoId()
    categoryId: string;



}
