import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

interface PermissionRequest {
  user?: {
    member?: {
      memberships: Array<{
        organizationId: string;
        isOwner: boolean;
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
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PermissionRequest>();
    const user = request.user;

    // Attempt to resolve organizationId from request (params or body)
    const organizationId =
      request.params.organizationId ||
      request.params.orgId ||
      request.body?.organizationId ||
      request.params.id;

    if (!user || !user.member) {
      return false; // Not authenticated or member not loaded
    }

    if (!organizationId) {
      return false; // No org context to evaluate permissions against
    }

    // Check if user is the owner of the organization
    const membership = user.member.memberships.find(
      (m) => m.organizationId === organizationId,
    );
    if (!membership) {
      return false; // Not a member of the organization
    }

    // Owner check: Either flag on membership or matching ownerId on organization
    if (membership.isOwner || membership.organization?.ownerId === user.sub) {
      return true;
    }

    const userPermissions = new Set<string>();
    for (const memberRole of membership.roles) {
      for (const rolePermission of memberRole.role.permissions) {
        userPermissions.add(rolePermission.permission.key);
      }
    }

    // Must have all required permissions
    return requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );
  }
}
