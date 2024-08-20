import "aws-sdk-client-mock-jest";

import { APIGatewayEvent } from "aws-lambda";
import { mockClient } from "aws-sdk-client-mock";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

import handler from "../../handler";

let ddbMock = mockClient(DynamoDBDocumentClient);
let snsMock = mockClient(SNSClient);

beforeEach(() => {
  ddbMock.reset();
  snsMock.reset();
});

beforeAll(() => {
  process.env.TABLE_NAME = "MY_TABLE";
});

describe("Create User", () => {
  it("should return an error if the required body is missing", async () => {
    // Act
    const response = await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: "qasim",
        email: "qasim@calo.app",
      }) as Partial<APIGatewayEvent>,
    });

    // Assert
    expect(response.statusCode).toEqual(422);
    expect(response.body).toEqual(null);
  });

  it("should return a internal server error if creating the user failed", async () => {
    // Arrange
    ddbMock.on(BatchWriteCommand).rejectsOnce();

    // Act
    const response = await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: "qasim",
        email: "qasim@calo.app",
        phoneNumber: "+97332211331",
      }) as Partial<APIGatewayEvent>,
    });

    // Assert
    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual(null);
  });

  it("should write the user to the database", async () => {
    // Arrange
    ddbMock.on(BatchWriteCommand).resolvesOnce({});

    // Act
    await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: "qasim",
        email: "qasim@calo.app",
        phoneNumber: "+97332211331",
      }) as Partial<APIGatewayEvent>,
    });

    // Assert
    expect(ddbMock).toHaveReceivedNthCommandWith(1, BatchWriteCommand, {
      RequestItems: {
        MY_TABLE: [
          {
            PutRequest: {
              Item: {
                pk: "user",
                sk: "+97332211331",
                email: "qasim@calo.app",
                name: "qasim",
                phoneNumber: "+97332211331",
              },
            },
          },
        ],
      },
    });
  });

  it("should publish an event to the SNS topic after successfully creating the user", async () => {
    // Arrange
    ddbMock.on(BatchWriteCommand).resolvesOnce({});
    snsMock.on(PublishCommand).rejectsOnce({});

    // Act
    await handler({
      // @ts-ignore
      body: JSON.stringify({
        name: "qasim",
        email: "qasim@calo.app",
        phoneNumber: "+97332211331",
      }) as Partial<APIGatewayEvent>,
    });

    // Assert
    expect(snsMock).toHaveReceivedCommandTimes(PublishCommand, 1);
  });

  it.todo("should return the user details when creation is successful");
});
