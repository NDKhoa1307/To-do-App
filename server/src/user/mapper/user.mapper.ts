import { PageResponseDto } from '../dto/user-response.dto';
import { UserDocument } from '../schemas/User.schema';

export class UserMapper {
    constructor() {}

    toDto(user: UserDocument): PageResponseDto {
        const userDocument = { ...user['_doc'], id: user['_doc']._id };
        const responseDto: PageResponseDto = new PageResponseDto();

        Object.keys(responseDto).forEach((key: string) => {
            responseDto[key] = userDocument[key];
        });

        return responseDto;
    }
}
