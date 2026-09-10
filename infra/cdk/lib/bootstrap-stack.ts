import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * Bootstrap stack — exports the GitHub CodeConnections ARN used by the pipeline
 * source stage. The connection itself is created manually once (it requires an
 * OAuth handshake in the AWS console), then its ARN is passed here.
 *
 * Deploy once per account/region (veasystems / us-east-1):
 *   cdk deploy AimsBootstrapStack \
 *     --parameters GitHubConnectionArn=arn:aws:codeconnections:us-east-1:817583489060:connection/<id>
 */
export class BootstrapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectionArn = new cdk.CfnParameter(this, 'GitHubConnectionArn', {
      type: 'String',
      description: 'ARN of the existing CodeStar/CodeConnections GitHub connection',
    });

    new cdk.CfnOutput(this, 'GitHubConnectionArnExport', {
      value: connectionArn.valueAsString,
      exportName: 'AimsGitHubConnectionArn',
    });
  }
}
