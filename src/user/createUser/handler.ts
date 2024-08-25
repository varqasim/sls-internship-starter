import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { SNSClient } from '@aws-sdk/client-sns';
import { CreateUserUseCase } from "./useCase";
import { UserRepository } from "../repositories/userRepository";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

const userRepository = new UserRepository(docClient);

export default async (event: APIGatewayEvent) => {
  try {
    const { name, email, phoneNumber } = JSON.parse(event.body!);

    const useCase = new CreateUserUseCase(userRepository, snsClient);
    const user = await useCase.exec(name, email, phoneNumber);

    return {
      statusCode: 201,
      body: JSON.stringify({ ...user })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: null
    }
  }
};
