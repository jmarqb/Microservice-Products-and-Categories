import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCategoryDto {

    @ApiProperty({ 
        example: 'Food', 
        description: 'Name of the category'
    })
    @IsString()
    @MinLength(3)
    @IsNotEmpty()
    name:string;

    
    userId: string;

}
