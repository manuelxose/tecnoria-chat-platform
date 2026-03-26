import { IAuthService, IUserRepository } from "../ports/IAuthService.js";

export interface LoginRequest {
  email: string;
  password:  string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private authService: IAuthService
  ) {}

  public async execute(request: LoginRequest): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      return { success: false, error: "USER_NOT_FOUND" };
    }

    const isValid = await this.authService.comparePasswords(request.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "INVALID_PASSWORD" };
    }

    const token = this.authService.signToken({
      sub: user.id,
      email: user.email,
      platformRole: user.platformRole
    });

    return { success: true, token };
  }
}
