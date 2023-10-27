import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { LoggerService } from '../common/logger/logger.service';
import { EventEmitter } from 'events';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;

  let mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  }

  const mockCategoriesModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndRemove: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndUpdate: jest.fn()
  }
  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn()
  };

  const ERROR_MESSAGES = {
    INTERNAL_SERVER: 'Error Unknow in database.',
    DUPLICATE_KEY: 'Duplicate Key.',
    NOT_FOUND: 'Not Found.'
};

  const categoryId = '6519aa9fe5b910fd36258938';
  const mockCategory =
  {
    "_id": "6519aa9fe5b910fd36258938",
    "name": 'CategoryOne',
    "userId": 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
    "productId": [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: 'CategoryModel', useValue: mockCategoriesModel },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EventEmitter, useValue: mockEventEmitter }
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    //Define a sample CreateCategoryDto to use for the test
    const createCategoryDto = {
      name: 'newCategory',
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e'
    };

    it('should create a category succesfully', async () => {
      //Define the expected result after creating a category with the given createCategoryDto
      const createdCategory = {
        _id: "6519aa9fe5b910fd36258938",
        name: 'newCategory',
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
        productId: [],
      }
      createdCategory.name = createdCategory.name.charAt(0).toUpperCase() + createdCategory.name.slice(1);

      //Mock the behavior of the Categories Model's create method.
      mockCategoriesModel.create.mockReturnValue(createdCategory);

      // Call the service's create method with the sample CreateCategoryDto.
      const result = await service.create(createCategoryDto);

      //Assert that the Categories Model's create method was called with the correct data.
      expect(mockCategoriesModel.create).toHaveBeenCalledWith(createCategoryDto);

      //Assert that the service's create method returns the expected result, 
      expect(result).toEqual({
        _id: "6519aa9fe5b910fd36258938",
        name: createCategoryDto.name,
        userId: createCategoryDto.userId,
        productId: [],
      });

    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockCategoriesModel.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(service.create(createCategoryDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.INTERNAL_SERVER);
    });

    //Handling Error 400 BadRequestException - Duplicate Key
    it('should throw an error 400 when category already exists in database', async () => {
      mockCategoriesModel.create.mockRejectedValue({
        message: ERROR_MESSAGES.DUPLICATE_KEY,
        code: 11000
      });

      await expect(service.create(createCategoryDto)).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.DUPLICATE_KEY);
    });

  });

  describe('findAll', () => {
    const mockPaginationDto = {
      limit: 5,
      offset: 0
    };
    it('should retrieve all categories', async () => {

      // Mock the data returned by the Model.
      const mockCategories = [
        {
          "_id": "6519aa9fe5b910fd36258938",
          "name": 'CategoryOne',
          "userId": 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
          "productId": [],
        },
        {
          "_id": "6519aa9fe5b910fd36258939",
          "name": 'CategoryTwo',
          "userId": 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
          "productId": [],
        },
      ];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockCategories)
      };

      // Verify that the model was called with the correct parameters.
      mockCategoriesModel.find.mockReturnValue(mockFind);
      mockCategoriesModel.countDocuments.mockResolvedValue(20);

      const result = await service.findAll(mockPaginationDto);

      expect(mockCategoriesModel.find).toHaveBeenCalled();
      expect(mockFind.populate).toHaveBeenCalledWith('productId', '_id name userId');
      expect(mockFind.skip).toHaveBeenCalledWith(Number(mockPaginationDto.offset));
      expect(mockFind.limit).toHaveBeenCalledWith(Number(mockPaginationDto.limit));

      // Check the returned result.
      expect(result).toEqual({
        items: mockCategories,
        total: 20,
        currentPage: 1,
        totalPages: 4
      });

    });

  });

  describe('findOne', () => {
    it('should return a category', async () => {

      // Verify that the model was called with the correct parameters.
      mockCategoriesModel.findById.mockResolvedValue(mockCategory);

      const result = await service.findOne(categoryId);

      expect(mockCategoriesModel.findById).toHaveBeenCalledWith(categoryId)

      // Check the returned result.
      expect(result).toEqual(mockCategory);

    });

    it('should throw NotFoundException if category not exists in database', async () => {
      mockCategoriesModel.findById.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.findOne(categoryId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

    });
  });

  describe('update', () => {
    const mockUpdCategoryDto = {
      name: 'UpdateCategory'
    }

    const mockUpdatedCategory = {
      "_id": "6519aa9fe5b910fd36258938",
      "name": 'CategoryOne',
      "userId": 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
      "productId": [],
    };

    it('should update category details if provided valid data', async () => {

      //Call to the find(id) method in services
      mockCategoriesModel.findById.mockResolvedValue(mockCategory);

      const category = await service.findOne(categoryId);

      expect(mockCategoriesModel.findById).toHaveBeenCalledWith(categoryId)

      // Check the returned category.
      expect(category).toEqual(mockCategory);


      mockCategoriesModel.findOneAndUpdate.mockResolvedValue(mockUpdatedCategory);

      // Call the service's update method with the sample mockUpdCategoryDto.
      const result = await service.update(categoryId, mockUpdCategoryDto);

      expect(mockCategoriesModel.findOneAndUpdate).toHaveBeenCalledWith(mockCategory, mockUpdCategoryDto, { new: true });

      //Assert that the service's updated method returns the expected result, 
      expect(result).toEqual(mockUpdatedCategory);
    });


    it('should throw NotFoundException if category not exists in database', async () => {
      mockCategoriesModel.findById.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.findOne(categoryId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

      mockCategoriesModel.findOneAndUpdate.mockRejectedValue(null);

    });

  });

  describe('remove', () => {

    it('should remove a category succesfully', async () => {

      // Mocks the response of findByIdAndRemove to simulate a successful removal
      mockCategoriesModel.findByIdAndRemove.mockResolvedValue({ _id: categoryId, name: 'someCategory' });

      // Calls the remove method
       await service.remove(categoryId);

      // Checks that the correct method on the model was called
      expect(mockCategoriesModel.findByIdAndRemove).toHaveBeenCalledWith(categoryId);

      // Ensures the CATEGORY_DELETED event was emitted with the correct ID
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('CATEGORY_DELETED', { categoryId: categoryId });

    });

    it('should throw NotFoundException if category not exists in database', async () => {
      mockCategoriesModel.findByIdAndRemove.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.remove(categoryId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

    });


  });

});
