import { UserMapper } from './user.mapper';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDocument } from '../schemas/User.schema';
import { PageResponseDto } from '../dto/user-response.dto';

describe('User mapper', () => {
    let userMapper: UserMapper;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UserMapper],
        }).compile();

        userMapper = module.get<UserMapper>(UserMapper);
    });

    it('should be defined', () => {
        expect(userMapper).toBeDefined();
    });

    describe('toDto', () => {
        it('should convert from UserDocument to PageResponseDto', () => {
            const mockUserDocument: UserDocument = {
                _doc: {
                    _id: '1',
                    username: 'kdnguyen',
                },
            } as any;

            const pageResponseDto: PageResponseDto = {
                id: '1',
                username: 'kdnguyen',
            } as any;

            const result = userMapper.toDto(mockUserDocument);
            expect(result).toEqual(pageResponseDto);
        });
    });
});
