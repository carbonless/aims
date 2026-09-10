import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { AuthStack } from './auth-stack';
import { ApiStack } from './api-stack';

/**
 * One deployable copy of AIMS (all application stacks), instantiated once per
 * pipeline stage (Dev, Prod).
 */
export class AppStage extends cdk.Stage {
  public readonly storageStack: StorageStack;
  public readonly databaseStack: DatabaseStack;
  public readonly authStack: AuthStack;
  public readonly apiStack: ApiStack;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    this.storageStack = new StorageStack(this, 'Storage');
    this.databaseStack = new DatabaseStack(this, 'Database');
    this.authStack = new AuthStack(this, 'Auth');
    this.apiStack = new ApiStack(this, 'Api', {
      table: this.databaseStack.table,
      userPool: this.authStack.userPool,
    });
  }
}
