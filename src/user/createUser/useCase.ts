import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { UserRepository } from "../repositories/userRepository";
import { User } from "../User";

export class CreateUserUseCase {

  constructor(
    private readonly userRepository: UserRepository,
    private readonly snsClient: SNSClient
  ) { }

  async exec(name: string, email: string, phoneNumber: string): Promise<User> {
    let user: User;

    try {
      user = User.create(name, email, phoneNumber);
    } catch (error) {
      throw new Error('Not able to create user');
    }

    await this.userRepository.create(
      name,
      email,
      phoneNumber
    );


    const snsPublishCommand = new PublishCommand({
      TopicArn: process.env.SNS_TOPIC!,
      Message: JSON.stringify({ name, phoneNumber, email })
    });
    await this.snsClient.send(snsPublishCommand);

    return user;

  }
}