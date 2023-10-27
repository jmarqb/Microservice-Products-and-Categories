import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CommonModule } from '../common/common.module';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { RequestWithUser } from '../common/interfaces/paginated-result.interface';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const ERROR_MESSAGES = {
    INTERNAL_SERVER: 'Error Unknow in database.',
    DUPLICATE_KEY: 'Duplicate Key.',
    NOT_FOUND: 'Not Found.',
    INVALID_ID: 'Invalid MongoId.'
  };

  const mockCategoriesService = {
    create: jest.fn().mockImplementation((dto: CreateCategoryDto) => Promise.resolve({
      name: dto.name,
      userId: dto.userId,
      productId: [],
      _id: "6519aa9fe5b910fd36258938"
    })),

    findAll: jest.fn().mockImplementation((dto: PaginationDto) => Promise.resolve({
      items: ['_id', 'name', 'userId', 'productId'],
      total: 10,
      currentPage: 1,
      totalPages: 5
    })),

    findOne: jest.fn().mockImplementation((id: string) => Promise.resolve({
      id: '6519aa9fe5b910fd36258938',
      name: 'categoryName',
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
      productId: ['idProductAssociated']
    })),

    update: jest.fn().mockImplementation((id: string, updDto: UpdateCategoryDto) => Promise.resolve({
      id: '6519aa9fe5b910fd36258938',
      name: 'UpdateCategoryName',
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
      productId: ['idProductAssociated']
    })),

    remove: jest.fn().mockImplementation((id: string) => Promise.resolve({

    })),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
      ],
      imports: [CommonModule]
    }).overrideProvider(CategoriesService).useValue(mockCategoriesService).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockRequest = {
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
    } as RequestWithUser;

    it('should be create a Category', async () => {
      

      const dto = {
        name: 'newCategory',
        userId: mockRequest.userId
      };

      const result = await controller.create(mockRequest,dto);

      // Verify if the function create was called with a valid dto
      expect(mockCategoriesService.create).toHaveBeenCalledWith(dto);

      //Check the returned value
      expect(result).toEqual({
        name: result.name,
        userId: result.userId,
        productId: [],
        _id: "6519aa9fe5b910fd36258938"
      });
    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockCategoriesService.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(controller.create(mockRequest,{
        name: 'newCategory',
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e'
      })).rejects.toThrow(InternalServerErrorException);
    });

    //Handling Error 400 BadRequestException
    it('should throw an error 400 when category already exists in database', async () => {
      mockCategoriesService.create.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.DUPLICATE_KEY));
      await expect(controller.create(mockRequest,{
        name: 'newCategory',
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e'
      })).rejects.toThrow(BadRequestException);

    });
  });

  describe('findAll',()=>{

    it('should be return Array of categories and paginated data', async ()=>{
      const pagDto = {
        limit: 10,
        offset: 0
      };

      await controller.findAll(pagDto);

      // Verify if the function create was called with a valid dto
      expect(mockCategoriesService.findAll).toHaveBeenCalledWith(pagDto);

       //Check the value returned
       await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: ['_id', 'name', 'userId', 'productId'],
        total: 10,
        currentPage: 1,
        totalPages: 5
      });
    });

     //findAll method return empty list no categories are present
     it('should return an empty list when no categories are present', async () => {

      mockCategoriesService.findAll.mockResolvedValue({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });

      const pagDto = {
        limit: 10,
        offset: 0
      };

      await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      });
    });

  });

  describe('findOne',()=>{
    //findOne Method Invalid MongoId
    it('should throw an BadRequestException when is a Invalid MongoId', async () => {
      const invalidId = 'InvalidID';

      mockCategoriesService.findOne.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.findOne(invalidId)).rejects.toThrow(BadRequestException);
    });

     //findOne Category Not Found in database
     it('should throw an NotFoundException when category not exists in database', async () => {
      const validId = '6519aa9fe5b910fd36258938';

      // Mock the service to return a rejected promise with NotFoundException
      mockCategoriesService.findOne.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));

      // Expect the controller to throw a NotFoundException
      await expect(controller.findOne(validId)).rejects.toThrow(NotFoundException);

    });

     //findOne method -return correct data
     it('should return the correct category data for a valid MongoId', async () => {
      const validId = '6519aa9fe5b910fd36258938';

      mockCategoriesService.findOne.mockResolvedValue({
        _id: "6519aa9fe5b910fd36258938",
        name: 'categoryName',
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
        productId: [],
      })

      const result = await controller.findOne(validId);

      // Verify if the function findOne was called with a valid id
      expect(mockCategoriesService.findOne).toHaveBeenCalledWith(validId);

      //Check the value returned
      expect(result).toEqual({
        _id: "6519aa9fe5b910fd36258938",
        name: 'categoryName',
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
        productId: [],
      });
    });

  });

  describe('update', ()=>{
    const invalidId = 'invalidId'
    const validId = '6519aa9fe5b910fd36258938';

    const updDto = {
      name:'updateNameCategory',
    };

    const updateCategory = {
      id: validId,
      ...updDto,
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
      productId: [],
    };

    //Suposed if service return a updated category
    mockCategoriesService.update.mockResolvedValue(updateCategory);

    it('should update category details if provided valid data', async () => {
      expect(await controller.update(validId, updDto)).toEqual(updateCategory);
      expect(mockCategoriesService.update).toHaveBeenCalledWith(validId, updDto);
    });

    it('should throw an BadRequestException when is a Invalid MongoId', async () => {

      mockCategoriesService.update.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.update(invalidId, updDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoriesService.update.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.update('non-existent-uuid', updDto)).rejects.toThrow(NotFoundException);
    });

  });

  describe('remove', ()=>{
    const invalidId = 'invalidId'
    const validId = '6519aa9fe5b910fd36258938';
    const removedUser = {}

    it('should throw an BadRequestException when is a Invalid Mongo Id', async () => {

      mockCategoriesService.remove.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.remove(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      mockCategoriesService.remove.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.remove('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should remove category succesfully if provided valid data', async () => {
      mockCategoriesService.remove.mockResolvedValue(removedUser);

      expect(await controller.remove(validId)).toEqual(removedUser);
      expect(mockCategoriesService.remove).toHaveBeenCalledWith(validId);
    });
  });

});
