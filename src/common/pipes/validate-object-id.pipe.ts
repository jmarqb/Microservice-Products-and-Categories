import { BadRequestException, PipeTransform } from "@nestjs/common";
import { Types } from "mongoose";

export class ValidateMongoIdPipe implements PipeTransform{
    
    transform(value:string):string{

        if(!Types.ObjectId.isValid(value)){
            throw new BadRequestException('Invalid MongoDB Id');
        }
        return value;
    }
}