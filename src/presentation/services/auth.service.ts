import { bcryptAdapter } from "../../config";
import { prisma } from "../../data/postgres";
import { CustomError, RegisterUserDto, UserEntity } from "../../domain";
export class AuthService {
  constructor() {}

  public async registerUser(registerUserDto: RegisterUserDto) {
    const existsUser = await prisma.user.findFirst({
      where: {
        email: registerUserDto.email,
      },
    });
    if (existsUser) throw CustomError.badRequest("Email already exists");
    try {
      registerUserDto.password = bcryptAdapter.hash(registerUserDto.password);
      const user = await prisma.user.create({
        data: registerUserDto,
      });
      const { password, ...userEntity } = UserEntity.fromObject(user);
      return {
        user: userEntity,
        token: "ABC",
      };
    } catch (err) {
      throw CustomError.internalServer(`${err}`);
    }
  }
}
