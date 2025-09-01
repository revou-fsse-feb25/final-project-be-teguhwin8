import { Test, TestingModule } from '@nestjs/testing';
import { UserManualStepsService } from './user-manual-steps.service';

describe('UserManualStepsService', () => {
  let service: UserManualStepsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserManualStepsService],
    }).compile();

    service = module.get<UserManualStepsService>(UserManualStepsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
