import { Args, Query, Resolver } from '@nestjs/graphql';
import { PromotionService } from '../services/promotion.service';
import { Promotion } from '../entities/promotion.entity';

@Resolver()
export class PromotionResolver {
  constructor(private promotionService: PromotionService) {}

  @Query(() => [Promotion])
  async promotions() {
    return this.promotionService.findAll();
  }
} 