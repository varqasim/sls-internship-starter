import { APIGatewayEvent } from "aws-lambda";

export default async (event: APIGatewayEvent) => {
  console.log(event);
}