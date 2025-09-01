import { Test, TestingModule } from '@nestjs/testing';
import { OneSignalAppService } from './one-signal-app.service';

describe('OneSignalAppService', () => {
  let service: OneSignalAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OneSignalAppService],
    }).compile();

    service = module.get<OneSignalAppService>(OneSignalAppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
