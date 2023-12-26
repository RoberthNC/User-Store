import { JwtAdapter, bcryptAdapter, envs } from "../../config";
import { prisma } from "../../data/postgres";
import { EmailService } from "./email.service";
import {
  CustomError,
  LoginUserDto,
  RegisterUserDto,
  UserEntity,
} from "../../domain";
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

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
      await this.sendEmailValidationLink(user.email);
      const { password, ...userEntity } = UserEntity.fromObject(user);
      const token = await JwtAdapter.generateToken({ id: user.id });
      if (!token) throw CustomError.internalServer("Error while creating JWT");

      return {
        user: userEntity,
        token: token,
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
    });
    if (!token) throw CustomError.internalServer("Error while creating JWT");

    return {
      user: userEntity,
      token: token,
    };
  }

  private sendEmailValidationLink = async (email: string) => {
    const token = JwtAdapter.generateToken({ email });
    if (!token) throw CustomError.internalServer("Error getting token");
    const link = `${envs.WEBSERVICE_URL}/auth/validate-email/${token}`;
    const html = `
      <h1>Validate your email</h1>
      <p>Click on the following link to validate your email:</p>
      <a href=${link}>Validate your email: ${email}</a>
    `;
    const options = {
      to: email,
      subject: "Validate your email",
      htmlBody: html,
    };
    const wasSent = await this.emailService.sendEmail(options);
    if (!wasSent) {
      throw CustomError.internalServer("Error while sending email...");
    }
    return true;
  };

  public validateEmail = async (token: string) => {
    const payload = await JwtAdapter.validateToken(token);
    if (!payload) throw CustomError.unAuthorized("Invalid token");
    const { email } = payload as { email: string };
    if (!email)
      throw CustomError.internalServer("Email does not exists in token");
    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
    if (!user) throw CustomError.internalServer("Email not exists");
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailValidated: true,
      },
    });
    return true;
  };
}
