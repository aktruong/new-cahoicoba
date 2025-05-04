import { VendurePlugin } from '@vendure/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Promotion } from './entities/promotion.entity';
import { PromotionService } from './services/promotion.service';
import { PromotionResolver } from './resolvers/promotion.resolver';

@VendurePlugin({
  imports: [TypeOrmModule.forFeature([Promotion])],
  providers: [PromotionService],
  entities: [Promotion],
  resolvers: [PromotionResolver],
})
export class PromotionPlugin {} 