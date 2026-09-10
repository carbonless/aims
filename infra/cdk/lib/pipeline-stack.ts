import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  CodeBuildStep,
} from 'aws-cdk-lib/pipelines';
import { PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { AppStage } from './app-stage';

/**
 * Self-mutating CodePipeline for AIMS, modeled on the VEA Digital Asset
 * Platform pipeline. Sourced from carbonless/aims @ main. Two stages only —
 * Dev then Prod — since this is a demo (no Staging). Prod is auto-promoted;
 * add a ManualApprovalStep as a `pre` step to gate it if desired.
 */
export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const source = CodePipelineSource.connection('carbonless/aims', 'main', {
      // Imported from AimsBootstrapStack. Create the connection manually once.
      connectionArn: cdk.Fn.importValue('AimsGitHubConnectionArn'),
    });

    const pipeline = new CodePipeline(this, 'AimsPipeline', {
      pipelineName: 'aims',
      pipelineType: PipelineType.V2,
      codeBuildDefaults: {
        buildEnvironment: {
          computeType: codebuild.ComputeType.MEDIUM,
        },
      },
      synth: new ShellStep('Synth', {
        input: source,
        primaryOutputDirectory: 'infra/cdk/cdk.out',
        commands: [
          // Domain/handler build + tests run at the repo root first.
          'npm ci',
          'npm run build',
          'npm test',
          // Then synthesize the CDK app.
          'cd infra/cdk',
          'npm ci',
          'npx cdk synth',
        ],
      }),
      selfMutation: true,
    });

    const env = {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    };

    // Dev — deploys on every merge to main.
    const dev = new AppStage(this, 'Dev', { env });
    pipeline.addStage(dev, {
      post: [this.deployFrontendStep('Dev', dev)],
    });

    // Prod — demo: auto-promoted after Dev. To gate, add:
    //   pre: [new ManualApprovalStep('PromoteToProd')]
    const prod = new AppStage(this, 'Prod', { env });
    pipeline.addStage(prod, {
      post: [this.deployFrontendStep('Prod', prod)],
    });
  }

  private deployFrontendStep(stageName: string, stage: AppStage): CodeBuildStep {
    const envFromCfnOutputs: Record<string, cdk.CfnOutput> = {
      API_URL: stage.apiStack.apiUrlOutput,
      WEB_BUCKET: stage.storageStack.webBucketOutput,
      DISTRIBUTION_ID: stage.storageStack.distributionIdOutput,
      DISTRIBUTION_DOMAIN: stage.storageStack.distributionDomainOutput,
      USER_POOL_ID: stage.authStack.userPoolIdOutput,
      USER_POOL_CLIENT_ID: stage.authStack.userPoolClientIdOutput,
    };

    return new CodeBuildStep(`DeployFrontend-${stageName}`, {
      envFromCfnOutputs,
      commands: [
        'cd web',
        'npm ci',
        'npm run build',
        // Runtime config.json generated from CloudFormation outputs.
        `cat > dist/config.json << EOF
{
  "environment": "${stageName.toLowerCase()}",
  "api": { "baseUrl": "\${API_URL}api/v1" },
  "auth": { "userPoolId": "\${USER_POOL_ID}", "clientId": "\${USER_POOL_CLIENT_ID}", "region": "us-east-1" }
}
EOF`,
        'aws s3 sync dist/ s3://$WEB_BUCKET --delete',
        'aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"',
      ],
      rolePolicyStatements: [
        new iam.PolicyStatement({
          actions: ['s3:PutObject', 's3:DeleteObject', 's3:ListBucket', 's3:GetBucketLocation'],
          resources: [
            `arn:aws:s3:::${stageName.toLowerCase()}-storage-webbucket*`,
            `arn:aws:s3:::${stageName.toLowerCase()}-storage-webbucket*/*`,
          ],
        }),
        new iam.PolicyStatement({
          actions: ['cloudfront:CreateInvalidation'],
          resources: [`arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/*`],
        }),
      ],
    });
  }
}
