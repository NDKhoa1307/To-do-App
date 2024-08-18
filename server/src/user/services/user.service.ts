import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/User.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { PageResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mapper/user.mapper';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) {}

    userMapper: UserMapper = new UserMapper();

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.userModel.findOne({
            username: createUserDto.username,
        });

        if (existingUser) {
            throw new HttpException(
                'User already exists',
                HttpStatus.BAD_REQUEST,
            );
        }

        await this.userModel.create({
            ...createUserDto,
            password: await bcrypt.hash(createUserDto.password, 10),
        });
    }

    async getAll(): Promise<PageResponseDto[]> {
        const users: UserDocument[] = await this.userModel.find();
        return users.map((user) => this.userMapper.toDto(user));
    }

    async getUserById(id: string) {
        try {
            const user: UserDocument = await this.userModel.findById(id);
            if (user) {
                return this.userMapper.toDto(user);
            } else {
                throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }
        } catch (e) {
            throw e.name == 'HttpException'
                ? e
                : e.name == 'CastError'
                  ? new HttpException(
                        'Id is not correct',
                        HttpStatus.BAD_REQUEST,
                    )
                  : new HttpException(
                        'Something went wrong...',
                        HttpStatus.INTERNAL_SERVER_ERROR,
                    );
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const user = await this.getUserById(id);
        if (!user) {
            return new HttpException('User not found', HttpStatus.BAD_REQUEST);
        }

        const updatedInfo = {};
        for (const info in updateUserDto) {
            if (updateUserDto[info]) {
                updatedInfo[info] = updateUserDto[info];
            }
        }

        try {
            await this.userModel.updateOne({ _id: id }, updatedInfo);
        } catch (e) {
            if (e.code === 11000) {
                throw new HttpException(
                    'Username already existed in the system',
                    HttpStatus.BAD_REQUEST,
                );
            } else {
                throw new HttpException(
                    'Something went wrong...',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
        }
    }
}
