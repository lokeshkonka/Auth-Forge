import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Attempt to resolve organizationId from request (params or body)
    const organizationId = request.params.organizationId || request.params.id || request.params.orgId || request.body?.organizationId;

    if (!user || !user.member) {
      return false; // Not authenticated or member not loaded
    }

    if (!organizationId) {
      return false; // No org context to evaluate permissions against
    }

    // Check if user is the owner of the organization
    const isOwner = user.member.ownedOrganizations.some((org: any) => org.id === organizationId);
    if (isOwner) {
      return true;
    }

    // Check member's permissions in this organization
    const membership = user.member.memberships.find((m: any) => m.organizationId === organizationId);
    if (!membership) {
      return false; // Not a member of the organization
    }

    const userPermissions = new Set<string>();
    for (const memberRole of membership.roles) {
      for (const rolePermission of memberRole.role.permissions) {
        userPermissions.add(rolePermission.permission.key);
      }
    }

    // Must have all required permissions
    return requiredPermissions.every((permission) => userPermissions.has(permission));
  }
}
