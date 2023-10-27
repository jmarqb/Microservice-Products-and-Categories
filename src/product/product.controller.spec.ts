import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { ProductController } from './product.controller';
import { ProductService } from './product.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { CommonModule } from '../common/common.module';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RequestWithUser } from '../common/interfaces/paginated-result.interface';

describe('ProductController', () => {
  let controller: ProductController;

  const ERROR_MESSAGES = {
    INTERNAL_SERVER: 'Error Unknow in database.',
    DUPLICATE_KEY: 'Duplicate Key.',
    NOT_FOUND: 'Not Found.',
    INVALID_ID: 'Invalid MongoId.'
  };

  const productId = '6519aa9fe5b910fd36258938';
  const categoryId = '7765aa9fe5b910fd36258695';
  const userId = "b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e";

  const mockProductsService = {

    create: jest.fn().mockImplementation((dto: CreateProductDto) => Promise.resolve({
      name: dto.name,
      price: 0,
      stock: 0,
      sizes: ["sizeOne", "sizeTwo"],
      gender: "unisex",
      tags: [],
      userId: dto.userId,
      categoryId: categoryId,
      _id: productId
    })),

    findAll: jest.fn().mockImplementation((dto: PaginationDto) => Promise.resolve({
      items: ['_id', 'name', 'price', 'stock', 'sizes', 'gender', 'tags', 'userId', 'categoryId'],
      total: 10,
      currentPage: 1,
      totalPages: 5
    })),

    findOne: jest.fn().mockImplementation((id: string) => Promise.resolve({
      _id: productId,
      name: 'ProductName',
      price: 0,
      stock: 0,
      sizes: ["sizeOne", "sizeTwo"],
      gender: "unisex",
      tags: [],
      userId: userId,
      categoryId: categoryId,
    })),

    update: jest.fn().mockImplementation((id: string, updDto: UpdateProductDto) => Promise.resolve({
      _id: productId,
      name: 'ProductName',
      price: 0,
      stock: 0,
      sizes: ["sizeOne", "sizeTwo"],
      gender: "unisex",
      tags: [],
      userId: userId,
      categoryId: categoryId,
      description: 'sample description'
    })),

    remove: jest.fn().mockImplementation((id: string) => Promise.resolve({

    })),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [ProductService],
      imports: [CommonModule]
    }).overrideProvider(ProductService).useValue(mockProductsService)
      .compile();

    controller = module.get<ProductController>(ProductController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const mockRequest = {
      userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e',
    } as RequestWithUser;
    
    const dto = {
      name: "NewProduct",
      sizes: ["XL", "l"],
      gender: "unisex",
      categoryId: "651db162c501d9b685409c87",
      userId: mockRequest.userId
    };

    it('should be create a Product', async () => {

      const result = await controller.create(mockRequest,dto);

      // Verify if the function create was called with a valid dto
      expect(mockProductsService.create).toHaveBeenCalledWith(dto);

      //Check the returned value
      expect(result).toEqual({
        name: result.name,
        price: 0,
        stock: 0,
        sizes: ["sizeOne", "sizeTwo"],
        gender: "unisex",
        tags: [],
        userId: result.userId,
        categoryId: categoryId,
        _id: productId
      });
    });

    //Handling Error 500 InternalServerException
    it('should throw an error 500 when something goes wrong', async () => {
      mockProductsService.create.mockRejectedValue(new InternalServerErrorException(ERROR_MESSAGES.INTERNAL_SERVER));
      await expect(controller.create(mockRequest,dto)).rejects.toThrow(InternalServerErrorException);
    });

    //Handling Error 400 BadRequestException
    it('should throw an error 400 when product already exists in database', async () => {
      mockProductsService.create.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.DUPLICATE_KEY));
      await expect(controller.create(mockRequest,dto)).rejects.toThrow(BadRequestException);

    });
  });

  describe('findAll', () => {

    it('should be return Array of products and paginated data', async () => {
      const pagDto = {
        limit: 10,
        offset: 0
      };

      await controller.findAll(pagDto);

      // Verify if the function create was called with a valid dto
      expect(mockProductsService.findAll).toHaveBeenCalledWith(pagDto);

      //Check the value returned
      await expect(controller.findAll(pagDto)).resolves.toEqual({
        items: ['_id', 'name', 'price', 'stock', 'sizes', 'gender', 'tags', 'userId', 'categoryId'],
        total: 10,
        currentPage: 1,
        totalPages: 5
      });
    });

    //findAll method return empty list no products are present
    it('should return an empty list when no products are present', async () => {

      mockProductsService.findAll.mockResolvedValue({
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

      mockProductsService.findOne.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.findOne(invalidId)).rejects.toThrow(BadRequestException);
    });

     //findOne pRODUCT Not Found in database
     it('should throw an NotFoundException when product not exists in database', async () => {
      const validId = '6519aa9fe5b910fd36258938';

      // Mock the service to return a rejected promise with NotFoundException
      mockProductsService.findOne.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));

      // Expect the controller to throw a NotFoundException
      await expect(controller.findOne(validId)).rejects.toThrow(NotFoundException);

    });

     //findOne method -return correct data
     it('should return the correct product data for a valid MongoId', async () => {
      const validId = '6519aa9fe5b910fd36258938';

      mockProductsService.findOne.mockResolvedValue({
        _id: productId,
        name: 'ProductName',
        price: 0,
        stock: 0,
        sizes: ["sizeOne", "sizeTwo"],
        gender: "unisex",
        tags: [],
        userId: userId,
        categoryId: categoryId
      })

      const result = await controller.findOne(validId);

      // Verify if the function findOne was called with a valid id
      expect(mockProductsService.findOne).toHaveBeenCalledWith(validId);

      //Check the value returned
      expect(result).toEqual({
        _id: productId,
        name: 'ProductName',
        price: 0,
        stock: 0,
        sizes: ["sizeOne", "sizeTwo"],
        gender: "unisex",
        tags: [],
        userId: userId,
        categoryId: categoryId
      });
    });

  });

  describe('update', ()=>{
    const invalidId = 'invalidId'
    const validId = '6519aa9fe5b910fd36258938';

    const sampleUpdDto = {
        name: "NewProduct",
        sizes: ["XL", "l"],
        gender: "unisex",
        categoryId: "651db162c501d9b685409c87",
        userId: 'b3c92eba-71e0-44d9-b4ef-b8ad12e4b93e'
    };

    const updatedProduct = {
      _id: validId,
      ...sampleUpdDto,
      price: 0,
      stock: 0,
      tags: [],
      description: 'sample description'
    };

    //Suposed if service return a updated product
    mockProductsService.update.mockResolvedValue(updatedProduct);

    it('should update product details if provided valid data', async () => {
      expect(await controller.update(validId, sampleUpdDto)).toEqual(updatedProduct);
      expect(mockProductsService.update).toHaveBeenCalledWith(validId, sampleUpdDto);
    });

    it('should throw an BadRequestException when is a Invalid MongoId', async () => {
      mockProductsService.update.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));
      await expect(controller.update(invalidId, sampleUpdDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductsService.update.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.update('non-existent-uuid', sampleUpdDto)).rejects.toThrow(NotFoundException);
    });

  });

  describe('remove', ()=>{
    const invalidId = 'invalidId'
    const validId = '6519aa9fe5b910fd36258938';
    const removedUser = {}

    it('should throw an BadRequestException when is a Invalid Mongo Id', async () => {

      mockProductsService.remove.mockRejectedValue(new BadRequestException(ERROR_MESSAGES.INVALID_ID));

      await expect(controller.remove(invalidId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductsService.remove.mockRejectedValue(new NotFoundException(ERROR_MESSAGES.NOT_FOUND));
      await expect(controller.remove('non-existent-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should remove PRODUCT succesfully if provided valid data', async () => {
      mockProductsService.remove.mockResolvedValue(removedUser);

      expect(await controller.remove(validId)).toEqual(removedUser);
      expect(mockProductsService.remove).toHaveBeenCalledWith(validId);
    });
  });

});
