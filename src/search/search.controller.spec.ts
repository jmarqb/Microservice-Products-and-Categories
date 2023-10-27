import { Test, TestingModule } from "@nestjs/testing";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";

describe('SearchController', () => {
    let controller: SearchController;

    const mockSearchService = {
        search: jest.fn(),
    };

    const ERROR_MESSAGE = {
        INTERNAL_ERROR: `You forgot to implement a search for this collection`,
        INVALID_COLLECTION: `Allowed collections are product, categories`,
        TERM_NOT_NULL: `Term cannot be null`
    }

    afterEach(() => {
        jest.clearAllMocks();
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SearchController],
            providers: [
                { provide: SearchService, useValue: mockSearchService },
            ],

        }).compile();

        controller = module.get<SearchController>(SearchController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('find', () => {
        const mockParams = { collection: 'product', terms: 'mockTerm' };

        it('should return search results', async () => {
            const mockResult = [{ name: 'Mock Product' }];
            mockSearchService.search.mockResolvedValueOnce(mockResult);

            const result = await controller.find(mockParams);
            expect(result).toEqual(mockResult);
            expect(mockSearchService.search).toHaveBeenCalledWith(mockParams.collection, mockParams.terms);
        });

        it('should throw BadRequestException when invalid collection is provided', async () => {
            mockSearchService.search.mockImplementationOnce(() => {
                throw new BadRequestException(ERROR_MESSAGE.INVALID_COLLECTION);
            });

            try {
                await controller.find(mockParams);
                fail('Expected BadRequestException to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(ERROR_MESSAGE.INVALID_COLLECTION);
            }
            expect(mockSearchService.search).toHaveBeenCalledWith(mockParams.collection, mockParams.terms);
        });

        it('should throw InternalServerErrorException for unhandled collections', async () => {
            mockSearchService.search.mockImplementationOnce(() => {
                throw new InternalServerErrorException(ERROR_MESSAGE.INTERNAL_ERROR);
            });

            try {
                await controller.find(mockParams);
                fail('Expected InternalServerErrorException to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(InternalServerErrorException);
                expect(error.message).toBe(ERROR_MESSAGE.INTERNAL_ERROR);
            }
            expect(mockSearchService.search).toHaveBeenCalledWith(mockParams.collection, mockParams.terms);
        });

        it('should handle null term properly', async () => {
            const mockParams = { collection: 'product', terms: null };

            mockSearchService.search.mockImplementationOnce(() => {
                throw new BadRequestException(ERROR_MESSAGE.TERM_NOT_NULL);
            });
            try {
                await controller.find(mockParams);
                fail('Expected BadRequestException to be thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(BadRequestException);
                expect(error.message).toBe(ERROR_MESSAGE.TERM_NOT_NULL);
            }
        });

    });

});
