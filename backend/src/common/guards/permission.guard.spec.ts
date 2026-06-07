import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: any;
    let mockRequest: any;

    beforeEach(() => {
      mockRequest = {
        params: {},
        body: {},
        user: {
          member: {
            ownedOrganizations: [],
            memberships: [],
          },
        },
      };

      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      };
    });

    it('should return true if no permissions are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should return false if user or member is missing', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.created']);
      mockRequest.user = null;
      expect(guard.canActivate(mockContext)).toBe(false);

      mockRequest.user = {};
      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should return false if organizationId cannot be resolved', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.created']);
      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should return true if user is the owner of the organization', () => {
      const orgId = 'org-123';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.created']);
      mockRequest.params.orgId = orgId;
      mockRequest.user.member.memberships = [
        {
          organizationId: orgId,
          isOwner: true,
          roles: [],
        },
      ];

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should resolve organizationId correctly when both orgId and appId are present (Bug Fix Check)', () => {
      const orgId = 'org-123';
      const resourceId = 'app-456';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.created']);
      
      // Simulating GET /organizations/:orgId/applications/:appId
      mockRequest.params.orgId = orgId;
      mockRequest.params.appId = resourceId;
      
      // User is a member of org-123, NOT app-456 (which would happen if it picked the wrong ID)
      mockRequest.user.member.memberships = [
        {
          organizationId: orgId,
          isOwner: false,
          roles: [
            {
              role: {
                permissions: [
                  { permission: { key: 'application.created' } }
                ]
              }
            }
          ]
        }
      ];

      expect(guard.canActivate(mockContext)).toBe(true);
    });

    it('should return false if user has no membership in the organization', () => {
      const orgId = 'org-123';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.created']);
      mockRequest.params.orgId = orgId;
      mockRequest.user.member.memberships = [
        { organizationId: 'other-org', roles: [] }
      ];

      expect(guard.canActivate(mockContext)).toBe(false);
    });

    it('should return false if user lacks required permissions', () => {
      const orgId = 'org-123';
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['application.deleted']);
      mockRequest.params.orgId = orgId;
      mockRequest.user.member.memberships = [
        {
          organizationId: orgId,
          isOwner: false,
          roles: [
            {
              role: {
                permissions: [
                  { permission: { key: 'application.created' } }
                ]
              }
            }
          ]
        }
      ];

      expect(guard.canActivate(mockContext)).toBe(false);
    });
  });
});
