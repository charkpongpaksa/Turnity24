import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1"
});

const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const assignmentId = event.pathParameters?.assignmentId;
    const body = JSON.parse(event.body || "{}");

    const studentId = body.studentId;
    const fileKey = body.fileKey;
    const note = body.note || "";

    // Validate required fields
    if (!assignmentId || !studentId || !fileKey) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            success: false,
            message: "assignmentId, studentId and fileKey are required"
          },
          null,
          2
        )
      };
    }

    const submittedAt = new Date().toISOString();

    const item = {
      PK: `ASS#${assignmentId}`,
      SK: `SUBMISSION#${studentId}`,
      assignmentId,
      studentId,
      fileKey,
      note,
      status: "submitted",
      submittedAt
    };

    await ddb.send(
      new PutCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Item: item
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          success: true,
          message: "Submission saved successfully",
          submission: {
            assignmentId,
            studentId,
            status: "submitted",
            submittedAt,
            note,
            fileKey
          }
        },
        null,
        2
      )
    };
  } catch (error) {
    console.error("Submission save error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          success: false,
          message: "Internal Server Error",
          error: error.message
        },
        null,
        2
      )
    };
  }
};