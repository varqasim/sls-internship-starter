import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});

export default async (event: APIGatewayEvent) => {
  try {
    const { name, email, phoneNumber } = JSON.parse(event.body!);

    if (!phoneNumber) {
      return {
        statusCode: 422,
        body: null
      }
    }
  
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

    await docClient.send(command);

    const snsPublishCommand = new PublishCommand({
      TopicArn: process.env.SNS_TOPIC!,
      Message: JSON.stringify({ name, phoneNumber, email })
    });

    await snsClient.send(snsPublishCommand);

    return {
      statusCode: 201,
      body: JSON.stringify({ name, email, phoneNumber })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: null
    }
  }
};
