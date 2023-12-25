import { JwtAdapter, bcryptAdapter } from "../../config";
import { prisma } from "../../data/postgres";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from "../../domain";
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

  public async loginUser(loginUserDto: LoginUserDto) {
    const user = await prisma.user.findFirst({
      where: {
        email: loginUserDto.email,
      },
    });
    if (!user) throw CustomError.badRequest("Email not exists");
    const isMatching = bcryptAdapter.compare(
      loginUserDto.password,
      user.password
    );
    if (!isMatching) throw CustomError.badRequest("Password is not valid");
    const { password, ...userEntity } = UserEntity.fromObject(user);

    const token = await JwtAdapter.generateToken({
      id: user.id,
      email: user.email,
    });
    if (!token) throw CustomError.internalServer("Error while creating jwt");

    return {
      user: userEntity,
      token: token,
    };
  }
}
