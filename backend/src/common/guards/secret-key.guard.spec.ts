import { Test, TestingModule } from '@nestjs/testing';
import { SecretKeyGuard } from './secret-key.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('SecretKeyGuard', () => {
  let guard: SecretKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretKeyGuard],
    }).compile();

    guard = module.get<SecretKeyGuard>(SecretKeyGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };

      mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as any;
    });

    it('should throw UnauthorizedException if API key is missing', () => {
      expect(() => guard.canActivate(mockContext)).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if API key is not a secret key', () => {
      mockRequest.headers['x-api-key'] = 'pk_live_123';
      expect(() => guard.canActivate(mockContext)).toThrow(
        'This endpoint requires a Secret API Key',
      );
    });

    it('should return true if API key is a secret key', () => {
      mockRequest.headers['x-api-key'] = 'sk_live_123';
      expect(guard.canActivate(mockContext)).toBe(true);
    });
  });
});
