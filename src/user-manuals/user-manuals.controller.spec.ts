import { Test, TestingModule } from '@nestjs/testing';
import { UserManualsController } from './user-manuals.controller';
import { UserManualsService } from './user-manuals.service';

describe('UserManualsController', () => {
  let controller: UserManualsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManualsController],
      providers: [UserManualsService],
    }).compile();

    controller = module.get<UserManualsController>(UserManualsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
