import { Injectable } from '@nestjs/common';
import { PRODUCTS } from './products.data';
import { Product } from './products.types';
import { stringSimilarity } from 'string-similarity-js';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class ProductsService {
  constructor(private readonly chatService: ChatService) {}

  async getProduct({ name }: { name: string }): Promise<Product | 'not found'> {
    const product = PRODUCTS.find((p) =>
      p.model.toLowerCase().includes(name.toLowerCase()),
    );

    if (!product) {
      return 'not found';
    }

    return product;
  }

  async getSimilarProducts({
    name,
    numResults = 2,
  }: {
    name: string;
    numResults?: number;
  }): Promise<Product[]> {
    if (!name || name.trim() === '') {
      return [];
    }

    const searchTerm = name.toLowerCase();

    const productsWithSimilarity = PRODUCTS.map((product) => {
      const productText = `${product.model} ${product.brand}`.toLowerCase();

      const similarity = stringSimilarity(searchTerm, productText);

      return {
        product,
        similarity,
      };
    });

    const filteredProducts = productsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, numResults)
      .map((item) => item.product);

    return filteredProducts;
  }

  async getProducts(): Promise<Product[]> {
    return PRODUCTS;
  }

  
}
