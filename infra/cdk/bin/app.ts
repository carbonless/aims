#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BootstrapStack } from '../lib/bootstrap-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Deploy once to export the GitHub CodeConnections ARN.
new BootstrapStack(app, 'AimsBootstrapStack', { env });

// Self-mutating pipeline — deploys all application stacks (Dev -> Prod).
new PipelineStack(app, 'AimsPipelineStack', { env });

app.synth();
