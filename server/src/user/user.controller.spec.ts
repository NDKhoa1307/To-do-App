import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './services/user.service';
import { PageResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import {
    BadRequestException,
    HttpException,
    HttpStatus,
    ValidationPipe,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UserController', () => {
    let userController: UserController;
    let userService: UserService;

    beforeEach(async () => {
        const mockUserService = {
            create: jest.fn(),
            getAll: jest.fn().mockReturnValue({}),
            getUserById: jest.fn().mockReturnValue({}),
            update: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        userController = module.get<UserController>(UserController);
        userService = module.get<UserService>(UserService);
    });

    it('should be defined', () => {
        expect(userController).toBeDefined();
    });

    describe('createUser', () => {
        it('should send a success message when user is created', async () => {
            const createUserDto: CreateUserDto = {
                username: 'user1',
                password: 'newPassword',
            };

            const expectedResponse = {
                message: 'User created successfully.',
                statusCode: HttpStatus.CREATED,
            };

            const response = await userController.createUser(createUserDto);

            expect(response).toEqual(expectedResponse);
            expect(userService.create).toHaveBeenCalledWith(createUserDto);
        });

        it('should send an error message when username or password is not given', async () => {
            const createUserDto: CreateUserDto = {
                username: '',
                password: '',
            };

            const expectedErrorResponse = [
                'username should not be empty',
                'password should not be empty',
            ];

            try {
                await new ValidationPipe().transform(createUserDto, {
                    type: 'body',
                    metatype: CreateUserDto,
                });

                await userController.createUser(createUserDto);
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toEqual('Bad Request Exception');

                expect(error.getResponse().message).toEqual(
                    expectedErrorResponse,
                );
            }
        });

        it('should send an error message if user already exists', async () => {
            const createUserDto: CreateUserDto = {
                username: 'user1',
                password: 'newPassword',
            };

            jest.spyOn(userService, 'create').mockImplementation(() => {
                throw new HttpException(
                    'User already exists',
                    HttpStatus.BAD_REQUEST,
                );
            });
            try {
                await userController.createUser(createUserDto);
            } catch (e) {
                expect(e.message).toEqual('User already exists');
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should send an error message if something goes wrong', async () => {
            const createUserDto: CreateUserDto = {
                username: 'user1',
                password: 'newPassword',
            };

            jest.spyOn(userService, 'create').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userController.createUser(createUserDto);
            } catch (e) {
                expect(e.message).toEqual('Something went wrong...');
                expect(e.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });

    describe('getUser', () => {
        it('should return a list of users', async () => {
            const mockUsers: PageResponseDto[] = [
                { id: '1', username: 'John' },
            ];
            jest.spyOn(userService, 'getAll').mockResolvedValue(mockUsers);
            const result = await userController.getUser();

            expect(result).toEqual(mockUsers);
            expect(userService.getAll).toHaveBeenCalled();
        });

        it('should send an error message if something goes wrong', async () => {
            jest.spyOn(userService, 'getAll').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userController.getUser();
            } catch (e) {
                expect(e.message).toEqual('Something went wrong...');
                expect(e.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });

    describe('getUserById', () => {
        it('should get the correct user without validation', async () => {
            const mockUsers: PageResponseDto = { id: '1', username: 'John' };
            jest.spyOn(userService, 'getUserById').mockResolvedValue(mockUsers);
            const result = await userController.getUserById('1');

            expect(result).toEqual(mockUsers);
            expect(userService.getUserById).toHaveBeenCalled();
        });

        it('should return an error message if user is not found', async () => {
            try {
                await userController.getUserById('1');
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.getResponse().message).toEqual('User not found');
                expect(e.getResponse().statusCode).toEqual(
                    HttpStatus.NOT_FOUND,
                );
            }
        });

        it('should return an error message if id is not correct', async () => {
            jest.spyOn(userService, 'getUserById').mockImplementation(() => {
                throw new HttpException(
                    'Id is not correct',
                    HttpStatus.BAD_REQUEST,
                );
            });

            try {
                await userController.getUserById('1');
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('Id is not correct');
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
                expect(e.getResponse()).toEqual('Id is not correct');
            }
        });

        it('should send an error message if something goes wrong', async () => {
            jest.spyOn(userService, 'getUserById').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userController.getUserById('1');
            } catch (e) {
                expect(e.message).toEqual('Something went wrong...');
                expect(e.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });

    describe('updateUser', () => {
        it('should update the user if everything is correct', async () => {
            const id = '1';
            const updateUserDto: UpdateUserDto = {
                username: 'John',
                password: 'newPassword',
            };

            const result = await userController.updateUser(id, updateUserDto);

            expect(result).toEqual({
                message: 'User updated successfully.',
                statusCode: HttpStatus.OK,
            });
        });

        it('should return an error message if id is not found', async () => {
            const id = '1';
            const updateUserDto: UpdateUserDto = {
                username: 'John',
                password: 'newPassword',
            };

            try {
                await userController.updateUser(id, updateUserDto);
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.getResponse().message).toEqual('Id is not correct');
                expect(e.getResponse().statusCode).toEqual(
                    HttpStatus.BAD_REQUEST,
                );
            }
        });

        it('should send an error message if something goes wrong', async () => {
            const id = '1';
            const updateUserDto: UpdateUserDto = {
                username: 'John',
                password: 'newPassword',
            };

            jest.spyOn(userService, 'update').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userController.updateUser(id, updateUserDto);
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('Something went wrong...');
                expect(e.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });
});
