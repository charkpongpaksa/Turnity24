import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1"
});

const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const assignmentId = event.pathParameters?.assignmentId;

    if (!assignmentId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "assignmentId is required"
        })
      };
    }

    const result = await ddb.send(
      new QueryCommand({
        TableName: process.env.DDB_TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": `ASS#${assignmentId}`
        }
      })
    );

    const items = result.Items || [];

    const submissions = items.map((item) => ({
      studentId: item.studentId,
      status: item.status || "submitted",
      submittedAt: item.submittedAt || null,
      note: item.note || "",
      fileKey: item.fileKey || "",
      late: item.late || false,
      score: item.score ?? null,
      feedback: item.feedback ?? null
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        assignmentId,
        total: submissions.length,
        submissions
      })
    };
  } catch (error) {
    console.error("Submissions list error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message
      })
    };
  }
};