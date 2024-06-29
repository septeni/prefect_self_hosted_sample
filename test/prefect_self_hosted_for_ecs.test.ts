import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { PrefectSelfHostedForEcsStack } from "../lib/prefect_self_hosted_for_ecs-stack";

test("Snapshot test", () => {
  const app = new cdk.App();
  const stack = new PrefectSelfHostedForEcsStack(app, "MyTestStack");
  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
