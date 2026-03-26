export interface IAuthService {
  hashPassword(password: string): Promise<string>;
  comparePasswords(password: string, hash: string): Promise<boolean>;
  signToken(payload: any): string;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<any | null>;
}
