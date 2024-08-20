import { faker } from '@faker-js/faker';
import { APIGatewayEvent } from 'aws-lambda';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { LambdaClient, ListEventSourceMappingsCommand, UpdateEventSourceMappingCommand } from '@aws-sdk/client-lambda';
import { ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { STS } from '@aws-sdk/client-sts';

import handler from "../../handler";
import { getQueueUrlByArn, lambdaFunctions } from '../../../../../tests/config';


const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const lambdaClient = new LambdaClient();
const sqsClient = new SQSClient();

let accountId: string;
beforeAll(async () => {
  const sts = new STS({ region: process.env.AWS_REGION });
  const { Account: account } = await sts.getCallerIdentity({});
  accountId = account!;
});

describe('Create User', () => {
  it('should store the user in the database', async () => {
    // Arrange
    const name = faker.person.firstName();
    const email = faker.internet.email();
    const phoneNumber = faker.helpers.fromRegExp('+973[0-9]{8}');

    // Act
    const response = await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: name,
        email: email,
        phoneNumber: phoneNumber
      }) as Partial<APIGatewayEvent>
    });

    // Assert
    expect(response.statusCode).toEqual(201);
    const jsonBody = JSON.parse(response.body!);
    expect(jsonBody).toEqual({
      name: name,
      email: email,
      phoneNumber: phoneNumber
    });

    // ASSERT THAT THE DATABASE HAS THE ACTUAL USER
    const command = new GetCommand({
      TableName: process.env.TABLE_NAME,
      Key: {
        pk: 'user',
        sk: phoneNumber
      }
    });

    const { Item: user } = await docClient.send(command);
    expect(user).toBeDefined();
    expect(user).toMatchObject({
      name,
      email,
      phoneNumber
    });
  });

  it('should send an SNS message to the send email SQS queue', async () => {
    // Arrange
    const name = faker.person.firstName();
    const email = faker.internet.email();
    const phoneNumber = faker.helpers.fromRegExp('+973[0-9]{8}');

    // Turn of ESM to the SQS
    const listESMCommand = new ListEventSourceMappingsCommand({
      FunctionName: lambdaFunctions.sendWelcomeEmail
    });
    const { EventSourceMappings } = await lambdaClient.send(listESMCommand);

    let updateESM = new UpdateEventSourceMappingCommand({
      UUID: EventSourceMappings![0].UUID,
      Enabled: false
    });
    await lambdaClient.send(updateESM);

    // Act
    await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: name,
        email: email,
        phoneNumber: phoneNumber
      }) as Partial<APIGatewayEvent>
    });

    await new Promise((resolve) => setTimeout(() => resolve(''), 20_000));

    // Assert
    // POLL THE SQS QUEUE
    const queueUrl = getQueueUrlByArn(accountId, EventSourceMappings![0].EventSourceArn!);
    const getSQSMessagesCommand = new ReceiveMessageCommand({
      QueueUrl: queueUrl
    });
    const { Messages: messages } = await sqsClient.send(getSQSMessagesCommand);

    expect(JSON.parse(messages![0].Body!)).toEqual({name, phoneNumber, email });

    // Clean up
    updateESM = new UpdateEventSourceMappingCommand({
      UUID: EventSourceMappings![0].UUID,
      Enabled: true
    });
    await lambdaClient.send(updateESM);
  });
});