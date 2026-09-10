import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
}

/**
 * API Gateway (HTTP API) with a Cognito JWT authorizer fronting the AIMS
 * Lambda handlers (Req 9.1). Routes/integrations are added in Task 12 as
 * handlers are implemented; this stub establishes the API + outputs the
 * pipeline's frontend build consumes.
 */
export class ApiStack extends cdk.Stack {
  public readonly httpApi: apigw.HttpApi;
  public readonly apiUrlOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.httpApi = new apigw.HttpApi(this, 'AimsHttpApi', {
      corsPreflight: {
        allowHeaders: ['authorization', 'content-type'],
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.PATCH,
          apigw.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'], // tightened to the CloudFront domain in Task 12
      },
    });

    this.apiUrlOutput = new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.httpApi.apiEndpoint,
    });
  }
}
