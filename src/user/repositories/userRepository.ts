import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { User } from "../User";

export class UserRepository {
  constructor(private readonly docClient: DynamoDBDocumentClient) {
    
  }

  async create(
    name: string,
    email: string,
    phoneNumber: string
  ) { 
    const command = new BatchWriteCommand({
      RequestItems: {
        [process.env.TABLE_NAME!]: [
          {
            PutRequest: {
              Item: { pk: 'user', sk: phoneNumber, name, email, phoneNumber }
            }
          }
        ]
      }
    });

    await this.docClient.send(command);    
  }

  async findUserByPhoneNumber(phoneNumber: string) {
    const command = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        'pk': 'user',
        'sk': phoneNumber
      }
    });
  
    const { Item: user } = await this.docClient.send(command);
    if (!user) {
      return undefined;
    }

    return User.create(user.name, user.phoneNumber, user.email);
  }
}