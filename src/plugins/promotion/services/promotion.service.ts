import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from '../entities/promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private promotionRepository: Repository<Promotion>,
  ) {}

  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find({
      where: { enabled: true },
      order: { createdAt: 'DESC' },
    });
  }
} 