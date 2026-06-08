import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

interface PermissionRequest {
  user?: {
    sub: string;
    member?: {
      memberships: Array<{
        organizationId: string;
        isOwner: boolean;
        organization?: {
          ownerId: string | null;
        };
        roles: Array<{
          role: {
            permissions: Array<{
              permission: {
                key: string;
              };
            }>;
          };
        }>;
      }>;
    };
  };
  params: Record<string, string>;
  body: Record<string, any>;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    // If no permissions required, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PermissionRequest>();
    const user = request.user;

    // --- Basic Actions (Allow for any organization member) ---
    // Anyone in the org can view applications and handle their own sessions
    const basicPermissions = [
      'application.view',
      'session.handle',
      'organization.view',
      'role.view',
      'permission.read',
      'member.view',
      'apikey.view',
      'audit.view'
    ];

    const organizationId =
      request.params.organizationId ||
      request.params.orgId ||
      request.body?.organizationId ||
      request.params.id;

    if (!user || !user.member) {
      return false;
    }

    if (!organizationId) {
      // If no organization context, we can't check permissions
      return false;
    }

    const membership = user.member.memberships.find(
      (m) => m.organizationId === organizationId,
    );

    if (!membership) {
      return false;
    }

    // Owner bypass - Prioritize isOwner flag, but also check ownerId as fallback
    if (membership.isOwner === true || membership.organization?.ownerId === user.sub) {
      return true;
    }

    // If all required permissions are basic ones, allow any member
    if (requiredPermissions.every(p => basicPermissions.includes(p))) {
      return true;
    }

    const userPermissions = new Set<string>();
    for (const memberRole of membership.roles) {
      if (memberRole.role && memberRole.role.permissions) {
        for (const rolePermission of memberRole.role.permissions) {
          if (rolePermission.permission) {
            userPermissions.add(rolePermission.permission.key);
          }
        }
      }
    }

    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
