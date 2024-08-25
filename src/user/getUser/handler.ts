import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient  } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { UserRepository } from "../repositories/userRepository";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const userRepository = new UserRepository(docClient);

export default async (event: APIGatewayEvent) => {
  const { phoneNumber } = event.pathParameters!;

  const user = await userRepository.findUserByPhoneNumber(phoneNumber!);
  if (!user) {
    return {
      statusCode: 404
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ...user })
  }
}