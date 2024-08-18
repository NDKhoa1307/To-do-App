import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Model } from 'mongoose';
import { User } from '../schemas/User.schema';
import { getModelToken } from '@nestjs/mongoose';
import { UserMapper } from '../mapper/user.mapper';
import { CreateUserDto } from '../dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PageResponseDto } from '../dto/user-response.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

describe('UserService', () => {
    let userService: UserService;
    let userMapper: UserMapper;
    let userModel: Model<User>;

    beforeEach(async () => {
        const mockUserModel = {
            findOne: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findById: jest.fn(),
            updateOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserMapper,
                    useValue: {
                        toDto: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(User.name),
                    useValue: mockUserModel,
                },
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        userMapper = module.get<UserMapper>(UserMapper);
        userModel = module.get<Model<User>>(getModelToken(User.name));
    });

    it('should be defined', () => {
        expect(userService).toBeDefined();
    });

    describe('create', () => {
        it('should create a new user with correct parameters', async () => {
            const createUserDto: CreateUserDto = {
                username: 'new_user1',
                password: 'password',
            };
            jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
            const newUser = {
                ...createUserDto,
                password: 'hashed_password',
            };
            jest.spyOn(userModel, 'create').mockResolvedValue(newUser as any);
            jest.spyOn(bcrypt, 'hash').mockImplementation(
                () => 'hashed_password',
            );

            await userService.create(createUserDto);

            expect(userModel.findOne).toHaveBeenCalledWith({
                username: createUserDto.username,
            });
            expect(userModel.create).toHaveBeenCalledWith(newUser);
            expect(bcrypt.hash).toHaveBeenCalledWith(
                createUserDto.password,
                10,
            );
        });

        it('should throw an error if the user has already existed', async () => {
            const createUserDto: CreateUserDto = {
                username: 'existed_user',
                password: 'hashed_password',
            };

            jest.spyOn(userModel, 'findOne').mockResolvedValue(createUserDto);

            try {
                await userService.create(createUserDto);
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('User already exists');
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });
    });

    describe('getAll', () => {
        it('should get all users and return the correct page response dto', async () => {
            const userDocument1 = {
                _doc: {
                    _id: '1',
                    username: 'user1',
                    password: 'password1',
                },
            };

            const userDocument2 = {
                _doc: {
                    _id: '2',
                    username: 'user2',
                    password: 'password2',
                },
            };

            const userDocuments = [userDocument1, userDocument2];

            const userPageResponseDtos: PageResponseDto[] = [
                { id: '1', username: 'user1' } as PageResponseDto,
                { id: '2', username: 'user2' } as PageResponseDto,
            ];

            jest.spyOn(userModel, 'find').mockResolvedValue(userDocuments);
            jest.spyOn(userMapper, 'toDto').mockImplementation((userDocument) =>
                userPageResponseDtos.find(
                    (dto) => dto.id === userDocument['_doc']._id,
                ),
            );

            const response = await userService.getAll();
            expect(response).toEqual(userPageResponseDtos);
        });
    });

    describe('getUserById', () => {
        it('should get the correct page response dto', async () => {
            const userDocument = {
                _doc: {
                    _id: '1',
                },
            };
            const userPageResponseDto: PageResponseDto = {
                id: '1',
            } as PageResponseDto;
            jest.spyOn(userModel, 'findById').mockResolvedValue(userDocument);
            jest.spyOn(userMapper, 'toDto').mockImplementation(
                () => userPageResponseDto,
            );

            const response = await userService.getUserById('1');
            expect(response).toEqual(userPageResponseDto);
            expect(response.id).toEqual('1');
        });

        it('should send the correct error message if Id is not found', async () => {
            jest.spyOn(userModel, 'findById').mockResolvedValue(null);

            try {
                await userService.getUserById('66bf23a122ce6f2cf76d6ea4');
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('User not found');
                expect(e.status).toEqual(HttpStatus.NOT_FOUND);
            }
        });

        it('should send the correct error message if Id is not in a correct format', async () => {
            class MockCastError extends Error {
                name = 'CastError';
                constructor(message?: string) {
                    super(message);
                    this.message = message;
                }
            }
            jest.spyOn(userModel, 'findById').mockImplementation(() => {
                throw new MockCastError();
            });

            try {
                await userService.getUserById('123');
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('Id is not correct');
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should send the correct error message if something else went wrong', async () => {
            jest.spyOn(userModel, 'findById').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userService.getUserById('66bf23a122ce6f2cf76d6ea4');
            } catch (e) {
                expect(HttpException).toThrow();
                expect(e.message).toEqual('Something went wrong...');
                expect(e.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });

    describe('update', () => {
        it('should update the correct user and params', async () => {
            const foundUser: PageResponseDto = {
                id: '1',
                username: 'user1',
            };

            const updateUserDto: UpdateUserDto = {
                username: 'user2',
                password: 'newPassword',
            };

            const updatedInfo = {
                username: 'user2',
                password: 'newPassword',
            };
            jest.spyOn(userService, 'getUserById').mockResolvedValue(foundUser);
            jest.spyOn(userModel, 'updateOne').mockReturnValue(null);

            await userService.update('1', updateUserDto);

            expect(userModel.updateOne).toBeCalledWith(
                { _id: '1' },
                updatedInfo,
            );
        });

        it('should only update the given params in dto', async () => {
            const foundUser: PageResponseDto = {
                id: '1',
                username: 'user1',
            };

            const updateUserDto = {
                username: 'user2',
                password: '',
            };

            const updatedInfo = {
                username: 'user2',
            };

            jest.spyOn(userService, 'getUserById').mockResolvedValue(foundUser);
            jest.spyOn(userModel, 'updateOne').mockReturnValue(null);

            await userService.update('1', updateUserDto);

            expect(userModel.updateOne).toBeCalledWith(
                { _id: '1' },
                updatedInfo,
            );
        });

        it('should throw the correct exception when user is not found', async () => {
            const updateUserDto = {};
            jest.spyOn(userService, 'getUserById').mockReturnValue(null);

            try {
                await userService.update(
                    '1',
                    updateUserDto as any as UpdateUserDto,
                );
            } catch (e) {
                expect(e).toBeInstanceOf(HttpException);
                expect(e.message).toEqual('User not found');
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should throw the correct exception when the new username is already in the system', async () => {
            const foundUser: PageResponseDto = {
                id: '1',
                username: 'user1',
            };

            const updateUserDto = {
                username: 'user1',
            };

            jest.spyOn(userService, 'getUserById').mockResolvedValue(foundUser);
            jest.spyOn(userModel, 'updateOne').mockImplementation(() => {
                const duplicateKeyError = new Error('Duplicated key');
                (duplicateKeyError as any).code = 11000;

                throw duplicateKeyError;
            });

            try {
                await userService.update(
                    '123',
                    updateUserDto as any as UpdateUserDto,
                );
            } catch (e) {
                expect(e).toBeInstanceOf(HttpException);
                expect(e.message).toEqual(
                    'Username already existed in the system',
                );
                expect(e.status).toEqual(HttpStatus.BAD_REQUEST);
            }
        });

        it('should throw the correct exception when something else went wrong', async () => {
            const foundUser: PageResponseDto = {
                id: '1',
                username: 'user1',
            };

            const updateUserDto = {
                username: 'user1',
            };

            jest.spyOn(userService, 'getUserById').mockResolvedValue(foundUser);
            jest.spyOn(userModel, 'updateOne').mockImplementation(() => {
                throw new Error();
            });

            try {
                await userService.update(
                    '123',
                    updateUserDto as any as UpdateUserDto,
                );
            } catch (e) {
                expect(e).toBeInstanceOf(HttpException);
                expect(e.message).toBe('Something went wrong...');
                expect(e.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    });
});
