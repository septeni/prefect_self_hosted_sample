import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";
import { ISecret } from "aws-cdk-lib/aws-secretsmanager";

export class PrefectSelfHostedForEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
    });

    // RDS
    const engine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_16_3,
    });
    const database = new rds.DatabaseInstance(this, "Postgresql", {
      vpc,
      securityGroups: [new ec2.SecurityGroup(this, "SecurityGroup", { vpc })],
      engine,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MICRO
      ),
      databaseName: "prefect",
    });
    database.connections.allowDefaultPortFromAnyIpv4();

    // ECS
    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
      }
    );

    const host: string = database.instanceEndpoint.hostname;
    const port: string = database.instanceEndpoint.port.toString();
    const dbSecret: ISecret = database.secret!;
    const username: string = dbSecret
      .secretValueFromJson("username")
      .unsafeUnwrap();
    const password: string = dbSecret
      .secretValueFromJson("password")
      .unsafeUnwrap();

    taskDefinition.addContainer("PrefectContainer", {
      image: ecs.ContainerImage.fromRegistry("prefecthq/prefect:3.0.0rc3-python3.11"),
      memoryLimitMiB: 2048,
      cpu: 1024,
      entryPoint: ["/opt/prefect/entrypoint.sh", "prefect", "server", "start"],
      environment: {
        PREFECT_API_URL: "http://localhost/api",
        PREFECT_SERVER_API_HOST: "0.0.0.0",
        PREFECT_SERVER_API_PORT: "80",
        PREFECT_API_DATABASE_CONNECTION_URL: `postgresql+asyncpg://${username}:${password}@${host}:${port}/prefect`,
      },
      portMappings: [{ containerPort: 80 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "PrefectContainer" }),
    });

    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
    });

    const lb = new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc,
      internetFacing: true,
    });
    
    // IP Whitelist
    // ここは必要に応じて設定してください
    const ipWhiteLists = ["0.0.0.0/0"];

    const listener = lb.addListener("Listener", { port: 80 });
    listener.addTargets("EcsTarget", {
      port: 80,
      priority: 1,
      conditions: [elbv2.ListenerCondition.sourceIps(ipWhiteLists)],
      targets: [service],
      healthCheck: { path: "/api/health" },
    });

    listener.addAction("DefaultTarget", {
      action: elbv2.ListenerAction.fixedResponse(401, {
        contentType: "text/plain",
        messageBody: "Unauthorised access",
      }),
    });
  }
}
