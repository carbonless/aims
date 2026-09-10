import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';

/**
 * Static hosting for the React/Vite SPA (S3 + CloudFront) and a bucket for
 * CSV export objects served via presigned URLs (Req 8.6).
 */
export class StorageStack extends cdk.Stack {
  public readonly webBucket: s3.Bucket;
  public readonly exportBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly webBucketOutput: cdk.CfnOutput;
  public readonly distributionIdOutput: cdk.CfnOutput;
  public readonly distributionDomainOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo
      autoDeleteObjects: true,
    });

    this.exportBucket = new s3.Bucket(this, 'ExportBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{ expiration: cdk.Duration.days(1) }],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo
      autoDeleteObjects: true,
    });

    this.distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    this.webBucketOutput = new cdk.CfnOutput(this, 'WebBucketName', {
      value: this.webBucket.bucketName,
    });
    this.distributionIdOutput = new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
    });
    this.distributionDomainOutput = new cdk.CfnOutput(this, 'DistributionDomain', {
      value: this.distribution.distributionDomainName,
    });
  }
}
