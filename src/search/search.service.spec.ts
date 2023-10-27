import { Test, TestingModule } from "@nestjs/testing";
import { SearchService } from "./search.service";
import { BadRequestException } from "@nestjs/common";

describe('SearchService', () => {
  let service: SearchService;

  const mockCategoriesModel = {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    populate:jest.fn()
  }

  const mockProductsModel = {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    populate:jest.fn()
  }

  const mockProduct = { name: 'Mock Product' };
const mockCategory = { name: 'Mock Category' };


beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: 'CategoryModel', useValue: mockCategoriesModel },
        { provide: 'ProductModel', useValue: mockProductsModel },

      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search method', () => {
    it('should search for products by name using regex', async () => {
        mockProductsModel.populate.mockResolvedValueOnce([mockProduct]);

        const result = await service.search('product', 'Mock');

        expect(result).toEqual([mockProduct]);
        expect(mockProductsModel.find).toHaveBeenCalledWith({ name: /Mock/i });
    });

    it('should search for categories by name using regex', async () => {
        mockCategoriesModel.find.mockResolvedValueOnce([mockCategory]);

        const result = await service.search('categories', 'Mock');

        expect(result).toEqual([mockCategory]);
        expect(mockCategoriesModel.find).toHaveBeenCalledWith({ name: /Mock/i });
    });

    it('should search for product by valid ObjectId', async () => {
        mockProductsModel.populate.mockResolvedValueOnce(mockProduct);

        const result = await service.search('product', '603f650a0953de235c89eada'); // Este es un ObjectId válido.

        expect(result).toEqual([mockProduct]);
        expect(mockProductsModel.findById).toHaveBeenCalledWith('603f650a0953de235c89eada');
    });
    it('should search for category by valid ObjectId', async () => {
        mockCategoriesModel.findById.mockResolvedValueOnce(mockCategory);

        const result = await service.search('categories', '603f650a0953de235c89eada');

        expect(result).toEqual([mockCategory]);
        expect(mockCategoriesModel.findById).toHaveBeenCalledWith('603f650a0953de235c89eada');
    });

    it('should throw BadRequestException for invalid collection', async () => {
        await expect(service.search('invalidCollection', 'Mock')).rejects.toThrow(BadRequestException);
    });

    it('should return an empty array if no product matches the search term', async () => {
        mockProductsModel.populate.mockResolvedValueOnce([]);
        
        const result = await service.search('product', 'NonExistentProduct');
        
        expect(result).toEqual([]);
        expect(mockProductsModel.find).toHaveBeenCalledWith({ name: /NonExistentProduct/i });
    });
    
    it('should return an empty array if no category matches the search term', async () => {
        mockCategoriesModel.find.mockResolvedValueOnce([]);
        
        const result = await service.search('categories', 'NonExistentCategory');
        
        expect(result).toEqual([]);
        expect(mockCategoriesModel.find).toHaveBeenCalledWith({ name: /NonExistentCategory/i });
    });
    
});

});
