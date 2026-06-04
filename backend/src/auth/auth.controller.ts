import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('health')
  health() {
    return { status: `ok` };
  }
}
