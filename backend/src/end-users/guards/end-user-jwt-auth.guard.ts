import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class EndUserJwtAuthGuard extends AuthGuard('end-user-jwt') {}
