import { Test, TestingModule } from '@nestjs/testing';
import { EndUsersController } from './end-users.controller';
import { EndUsersService } from '../services/end-users.service';
import { ApiKeyAuthGuard } from '../../common/guards/api-key.guard';
import { EndUserJwtAuthGuard } from '../guards/end-user-jwt-auth.guard';
import { SecretKeyGuard } from '../../common/guards/secret-key.guard';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('EndUsersController', () => {
  let controller: EndUsersController;
  let service: EndUsersService;

  const mockEndUsersService = {
    signup: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    getSessions: jest.fn(),
    revokeSession: jest.fn(),
    revokeAllSessions: jest.fn(),
    findAllUsers: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    bulkImportUsers: jest.fn(),
  };

  const mockApiKeyGuard = { canActivate: jest.fn(() => true) };
  const mockJwtGuard = { canActivate: jest.fn(() => true) };
  const mockSecretKeyGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EndUsersController],
      providers: [
        {
          provide: EndUsersService,
          useValue: mockEndUsersService,
        },
      ],
    })
      .overrideGuard(ApiKeyAuthGuard)
      .useValue(mockApiKeyGuard)
      .overrideGuard(EndUserJwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(SecretKeyGuard)
      .useValue(mockSecretKeyGuard)
      .compile();

    controller = module.get<EndUsersController>(EndUsersController);
    service = module.get<EndUsersService>(EndUsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validateSlug', () => {
    it('should throw ForbiddenException if slugs do not match', () => {
      const req = { application: { slug: 'other-slug' } } as any;
      expect(() => (controller as any).validateSlug(req, 'my-app')).toThrow(
        ForbiddenException,
      );
    });

    it('should not throw if slugs match', () => {
      const req = { application: { slug: 'my-app' } } as any;
      expect(() =>
        (controller as any).validateSlug(req, 'my-app'),
      ).not.toThrow();
    });
  });

  describe('findAllUsers', () => {
    it('should call service.findAllUsers with applicationId', async () => {
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.findAllUsers('my-app', req);
      expect(service.findAllUsers).toHaveBeenCalledWith('app-123');
    });
  });

  describe('createUser', () => {
    it('should call service.createUser with applicationId and dto', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.createUser('my-app', req, dto);
      expect(service.createUser).toHaveBeenCalledWith('app-123', dto);
    });
  });

  describe('updateUser', () => {
    it('should call service.updateUser with applicationId, id, and dto', async () => {
      const dto = { email: 'new@example.com' };
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.updateUser('my-app', 'user-123', req, dto);
      expect(service.updateUser).toHaveBeenCalledWith(
        'app-123',
        'user-123',
        dto,
      );
    });
  });

  describe('deleteUser', () => {
    it('should call service.deleteUser with applicationId and id', async () => {
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.deleteUser('my-app', 'user-123', req);
      expect(service.deleteUser).toHaveBeenCalledWith('app-123', 'user-123');
    });
  });

  describe('bulkImportUsers', () => {
    it('should call service.bulkImportUsers with applicationId and users array', async () => {
      const users = [{ email: 'u1@ex.com', password: 'p1' }];
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.bulkImportUsers('my-app', req, { users });
      expect(service.bulkImportUsers).toHaveBeenCalledWith('app-123', users);
    });
  });

  describe('signup', () => {
    it('should call service.signup', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const req = {
        application: { slug: 'my-app' },
        applicationId: 'app-123',
      } as any;
      await controller.signup('my-app', req, dto);
      expect(service.signup).toHaveBeenCalledWith('app-123', dto);
    });
  });

  describe('getProfile', () => {
    it('should call service.getProfile', async () => {
      const req = {
        application: { slug: 'my-app' },
        user: { userId: 'user-123' },
      } as any;
      await controller.getProfile('my-app', req);
      expect(service.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('getSessions', () => {
    it('should call service.getSessions with userId and sessionId', async () => {
      const req = {
        application: { slug: 'my-app' },
        user: { userId: 'user-123', sessionId: 'sess-456' },
      } as any;
      await controller.getSessions('my-app', req);
      expect(service.getSessions).toHaveBeenCalledWith('user-123', 'sess-456');
    });
  });
});
