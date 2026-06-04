import { Body, Controller, Post , Get } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('health')
  health() {
    return { status: `ok` };
  } 
  @Post('signup')
  signup(
    @Body() dto: SignupDto,
  ) {
    return this.authService.signup(dto);
  }
}







