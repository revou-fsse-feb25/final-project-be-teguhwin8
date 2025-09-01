import { Test, TestingModule } from '@nestjs/testing';
import { UserManualStepsController } from './user-manual-steps.controller';
import { UserManualStepsService } from './user-manual-steps.service';

describe('UserManualStepsController', () => {
  let controller: UserManualStepsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserManualStepsController],
      providers: [UserManualStepsService],
    }).compile();

    controller = module.get<UserManualStepsController>(
      UserManualStepsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
