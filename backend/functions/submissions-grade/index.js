import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-1"
});

const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const assignmentId = event.pathParameters?.assignmentId;
    const studentId = event.pathParameters?.studentId;

    const body = JSON.parse(event.body || "{}");

    const score = body.score;
    const feedback = body.feedback || "";

    if (!assignmentId || !studentId) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            success: false,
            message: "assignmentId and studentId are required"
          },
          null,
          2
        )
      };
    }

    if (score === undefined || score < 0 || score > 100) {
      return {
        statusCode: 400,
        body: JSON.stringify(
          {
            success: false,
            message: "score must be between 0 and 100"
          },
          null,
          2
        )
      };
    }

    const gradedAt = new Date().toISOString();

    await ddb.send(
      new UpdateCommand({
        TableName: process.env.DDB_TABLE_NAME,
        Key: {
          PK: `ASS#${assignmentId}`,
          SK: `SUBMISSION#${studentId}`
        },
        UpdateExpression:
          "SET #status = :status, score = :score, feedback = :feedback, gradedAt = :gradedAt",
        ExpressionAttributeNames: {
          "#status": "status"
        },
        ExpressionAttributeValues: {
          ":status": "graded",
          ":score": score,
          ":feedback": feedback,
          ":gradedAt": gradedAt
        }
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          success: true,
          message: "Grade saved successfully",
          grading: {
            assignmentId,
            studentId,
            status: "graded",
            score,
            feedback,
            gradedAt
          }
        },
        null,
        2
      )
    };
  } catch (error) {
    console.error("Grade submission error:", error);

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