import { Test, TestingModule } from '@nestjs/testing';
import { ToolkitController } from './toolkit.controller';

describe('ToolkitController', () => {
  let controller: ToolkitController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToolkitController],
    }).compile();

    controller = module.get<ToolkitController>(ToolkitController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
