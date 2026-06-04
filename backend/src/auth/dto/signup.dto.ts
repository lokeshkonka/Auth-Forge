export class SignupDto {
  organizationName: string;
  organizationSlug: string;

  email: string;
  password: string;

  firstName?: string;
  lastName?: string;
}