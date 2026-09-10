import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

/**
 * Cognito User Pool for AIMS authentication (Req 9). Managed login, password
 * policy, and token expiry (15-min access token supports the inactivity-expiry
 * requirement 9.9). Role is carried as a custom attribute / group claim.
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolIdOutput: cdk.CfnOutput;
  public readonly userPoolClientIdOutput: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, 'AimsUserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true, username: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // demo
    });

    // Roles as groups: Inventory_Manager, Safety_Officer, Auditor, Administrator.
    for (const role of [
      'Inventory_Manager',
      'Safety_Officer',
      'Auditor',
      'Administrator',
    ]) {
      new cognito.CfnUserPoolGroup(this, `Group${role}`, {
        userPoolId: this.userPool.userPoolId,
        groupName: role,
      });
    }

    this.userPoolClient = this.userPool.addClient('AimsWebClient', {
      authFlows: { userSrp: true },
      accessTokenValidity: cdk.Duration.minutes(15), // Req 9.9 inactivity window
      idTokenValidity: cdk.Duration.minutes(15),
      refreshTokenValidity: cdk.Duration.hours(8),
    });

    this.userPoolIdOutput = new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });
    this.userPoolClientIdOutput = new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
