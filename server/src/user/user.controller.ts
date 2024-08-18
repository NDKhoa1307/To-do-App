import {
    Controller,
    Post,
    Body,
    UsePipes,
    ValidationPipe,
    HttpStatus,
    HttpException,
    Get,
    Param,
    Put,
} from '@nestjs/common';
import { UserService } from './services/user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
@UsePipes(new ValidationPipe())
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post()
    async createUser(@Body() createUserDto: CreateUserDto) {
        try {
            await this.userService.create(createUserDto);

            return {
                message: 'User created successfully.',
                statusCode: HttpStatus.CREATED,
            };
        } catch (error) {
            throw new HttpException(
                error.message || 'Something went wrong...',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    async getUser() {
        try {
            return await this.userService.getAll();
        } catch (e) {
            throw new HttpException(
                e.message || 'Something went wrong...',
                e.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async getUserById(@Param('id') id: string) {
        try {
            return await this.userService.getUserById(id);
        } catch (e) {
            throw new HttpException(
                e.message || 'Something went wrong...',
                e.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put(':id')
    async updateUser(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        try {
            await this.userService.update(id, updateUserDto);

            return {
                message: 'User updated successfully.',
                statusCode: HttpStatus.OK,
            };
        } catch (e) {
            throw new HttpException(
                e.message || 'Something went wrong...',
                e.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
