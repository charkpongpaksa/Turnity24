import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const assignmentId = event.pathParameters.assignmentId;
    const body = JSON.parse(event.body || "{}");

    const studentId = body.studentId;
    const fileKey = body.fileKey;
    const note = body.note || "";

    const item = {
      PK: `ASS#${assignmentId}`,
      SK: `SUBMISSION#${studentId}`,
      assignmentId,
      studentId,
      fileKey,
      note,
      status: "submitted",
      submittedAt: new Date().toISOString()
    };

    await ddb.send(
      new PutCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Item: item
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Submission saved",
        item
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      })
    };
  }
};