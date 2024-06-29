#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { PrefectSelfHostedForEcsStack } from "../lib/prefect_self_hosted_for_ecs-stack";

const app = new cdk.App();
new PrefectSelfHostedForEcsStack(app, "PrefectSelfHostedForEcsStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
