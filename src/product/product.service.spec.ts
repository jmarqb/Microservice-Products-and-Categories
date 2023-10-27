import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { LoggerService } from '../common/logger/logger.service';
import { EventEmitter } from 'events';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;

  let mockEventEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  }

  const mockProductsModel = {
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

  const productId = '6519aa9fe5b910fd36258938';
  const categoryId = '7765aa9fe5b910fd36258695';
  const userId = "b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e";

  const mockProductCreated =
  {
    "name": "ProductName",
    "price": 0,
    "stock": 0,
    "sizes": ["sizeOne", "sizeTwo"],
    "gender": "unisex",
    "tags": [],
    "userId": userId,
    "categoryId": categoryId,
    "_id": productId
  };
  const mockProduct =
  {
    "_id": productId,
    "name": "ProductName",
    "price": 0,
    "stock": 0,
    "sizes": ["sizeOne", "sizeTwo"],
    "gender": "unisex",
    "tags": [],
    "userId": userId,
    "categoryId": {
      "_id": categoryId,
      "name": "categoryName",
      "userId": userId
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: 'ProductModel', useValue: mockProductsModel },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EventEmitter, useValue: mockEventEmitter }

      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    //Define a sample CreateProductDto to use for the test
    const createProductDto = {
      'name': 'newProduct',
      'sizes': ['sizesOne', 'sizesTwo'],
      'gender': 'men',
      'tags': [],
      'userId': userId,
      'categoryId': categoryId,
    };

    it('should create a product succesfully', async () => {

      //Mock the behavior of the Product Model's create method.
      mockProductsModel.create.mockReturnValue(mockProductCreated);

      // Call the service's create method with the sample createProductDto.
      const result = await service.create(createProductDto);

      //Assert that the Product Model's create method was called with the correct data.
      expect(mockProductsModel.create).toHaveBeenCalledWith(createProductDto);

      // Ensures the PRODUCT_CREATED event was emitted with the correct ID
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('PRODUCT_CREATED', { productId: productId, categoryId: categoryId });

      //Assert that the service's create method returns the expected result, 
      expect(result).toEqual(mockProductCreated);

    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockProductsModel.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(service.create(createProductDto)).rejects.toThrow(InternalServerErrorException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.INTERNAL_SERVER);
    });

    //Handling Error 400 BadRequestException - Duplicate Key
    it('should throw an error 400 when product already exists in database', async () => {
      mockProductsModel.create.mockRejectedValue({
        message: ERROR_MESSAGES.DUPLICATE_KEY,
        code: 11000
      });

      await expect(service.create(createProductDto)).rejects.toThrow(BadRequestException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.DUPLICATE_KEY);
    });

  });

  describe('findAll', () => {
    const mockPaginationDto = {
      limit: 5,
      offset: 0
    };
    it('should retrieve all products', async () => {

      // Mock the data returned by the Model.
      const mockProducts = [mockProduct, mockProduct];

      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProducts)
      };

      // Verify that the model was called with the correct parameters.
      mockProductsModel.find.mockReturnValue(mockFind);
      mockProductsModel.countDocuments.mockResolvedValue(20);

      const result = await service.findAll(mockPaginationDto);

      expect(mockProductsModel.find).toHaveBeenCalled();
      expect(mockFind.populate).toHaveBeenCalledWith('categoryId', '-__v -productId');
      expect(mockFind.skip).toHaveBeenCalledWith(Number(mockPaginationDto.offset));
      expect(mockFind.limit).toHaveBeenCalledWith(Number(mockPaginationDto.limit));

      // Check the returned result.
      expect(result).toEqual({
        items: mockProducts,
        total: 20,
        currentPage: 1,
        totalPages: 4
      });
    });

  });

  describe('findOne', () => {
    it('should return a product', async () => {

      // Verify that the model was called with the correct parameters.
      mockProductsModel.findById.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(mockProductsModel.findById).toHaveBeenCalledWith(productId)

      // Check the returned result.
      expect(result).toEqual(mockProduct);

    });

    it('should throw NotFoundException if product not exists in database', async () => {
      mockProductsModel.findById.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

    });
  });

  describe('update', () => {
    //Define a sample UpdateProductDto to use for the test
    const UpdateProductDto = {
      'name': 'newProduct',
      'sizes': ['sizesOne', 'sizesTwo'],
      'gender': 'men',
      'tags': [],
      'userId': userId,
      'categoryId': categoryId,
    };

    const mockUpdatedProduct = {
      ...mockProductCreated,
      "description": 'description_product'
    };

    it('should update product details if provided valid data', async () => {

      //Call to the find(id) method in services
      mockProductsModel.findById.mockResolvedValue(mockProduct);

      const product = await service.findOne(productId);

      expect(mockProductsModel.findById).toHaveBeenCalledWith(productId)

      // Check the returned product.
      expect(product).toEqual(mockProduct);

      mockProductsModel.findOneAndUpdate.mockResolvedValue(mockUpdatedProduct);

      // Call the service's update method with the sample UpdateProductDto.
      const result = await service.update(productId, UpdateProductDto);

      expect(mockProductsModel.findOneAndUpdate).toHaveBeenCalledWith(mockProduct, UpdateProductDto, { new: true });

      // Ensures the PRODUCT_CREATED event was emitted with the correct ID
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('PRODUCT_CREATED', { productId: mockUpdatedProduct._id, categoryId: mockUpdatedProduct.categoryId });

      //Assert that the service's updated method returns the expected result, 
      expect(result).toEqual(mockUpdatedProduct);
    });

    it('should throw NotFoundException if product not exists in database', async () => {
      mockProductsModel.findById.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

      mockProductsModel.findOneAndUpdate.mockRejectedValue(null);

    });
  });

  describe('remove', () => {

    it('should remove a product succesfully', async () => {

      // Mocks the response of findByIdAndRemove to simulate a successful removal
      mockProductsModel.findByIdAndRemove.mockResolvedValue({ _id: productId, name: 'someProduct' });

      // Calls the remove method
      await service.remove(productId);

      // Checks that the correct method on the model was called
      expect(mockProductsModel.findByIdAndRemove).toHaveBeenCalledWith(productId);

      // Ensures the PRODUCT_DELETED event was emitted with the correct ID
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('PRODUCT_DELETED', { productId: productId });

    });

    it('should throw NotFoundException if product not exists in database', async () => {
      mockProductsModel.findByIdAndRemove.mockRejectedValue({
        message: ERROR_MESSAGES.NOT_FOUND,
        status: 404
      });

      await expect(service.remove(productId)).rejects.toThrow(NotFoundException);
      expect(mockLoggerService.error.mock.calls[0][0]).toBe(ERROR_MESSAGES.NOT_FOUND);

    });


  });

});
