import { APIGatewayEvent } from "aws-lambda";
import { DynamoDBClient,  } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export default async (event: APIGatewayEvent) => {
  console.log(event.pathParameters);
  const { phoneNumber } = event.pathParameters!;

  const command = new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: {
      'pk': 'user',
      'sk': phoneNumber
    }
  });

  const { Item: user } = await docClient.send(command);

  if (!user) {
    return {
      statusCode: 404
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber
    })
  }

  

}