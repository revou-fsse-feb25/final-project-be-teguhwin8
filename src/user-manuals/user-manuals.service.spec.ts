import { Test, TestingModule } from '@nestjs/testing';
import { UserManualsService } from './user-manuals.service';

describe('UserManualsService', () => {
  let service: UserManualsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserManualsService],
    }).compile();

    service = module.get<UserManualsService>(UserManualsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
