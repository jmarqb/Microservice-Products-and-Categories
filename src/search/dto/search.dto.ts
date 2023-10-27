import { ApiProperty } from "@nestjs/swagger";

export class SearchDto {

    @ApiProperty()
   static collection: string;

    @ApiProperty()
   static terms: string;
}
