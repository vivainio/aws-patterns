import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';
import {aws_ec2 as ec2} from 'aws-cdk-lib';

// hidden from git, myah myah
import vpcConfig from './vpc-config';
// import * as sqs from 'aws-cdk-lib/aws-sqs';




// instantiate like
// new FgBootStack(app, 'FgbMyAppStack', 'SomeApp' {})
// resources will be named like SomeAppJobQueue etc
export class FgBootStack extends cdk.Stack {
  constructor(scope: Construct, id: string, appNamePrefix: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // should have policy to cycle out "dev" builds?
    // this bucket containst the app builds as .zip files
    const bucket = new s3.Bucket(this, appNamePrefix + 'Bucket', {
      versioned: true
    })

    // put jobs to this queue
    const jobQueue = new sqs.Queue(this, appNamePrefix + 'JobQueue', {
      visibilityTimeout: cdk.Duration.minutes(5)
    })


    // this lambda wakes up from sqs...
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const launcherLambda = new lambda.Function(this, appNamePrefix + "LauncherLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../launcher"),
      role: lambdaExecutionRole,
    })


    jobQueue.grantConsumeMessages(launcherLambda)
    launcherLambda.addEventSource(new lambdaEventSources.SqsEventSource(jobQueue))


    // and then launcher work in fargate cluster

    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ExistingVpc', {
      vpcId: vpcConfig.vpcId,
      availabilityZones: ["eu-west-1a"]
    })

    // empty sg for the app in vpc

    const sg = new ec2.SecurityGroup(this, appNamePrefix+"Sg", {
      vpc
    })


    const cluster = new ecs.Cluster(this, appNamePrefix + 'Cluster', {vpc: vpc});
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    })

    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      // dupe principal?
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')

    })
    bucket.grantRead(ecsTaskRole)


    const taskDef = new ecs.FargateTaskDefinition(this, appNamePrefix + 'TaskDef', {
      executionRole: executionRole,
      taskRole: ecsTaskRole

    })

    // can reuse the same image for all the apps
    const container = taskDef.addContainer( appNamePrefix + 'Container', {
      image: ecs.ContainerImage.fromRegistry('fgbootimg')
    })


    // lambda can run it

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ["ecs:RunTask"],
      resources: [taskDef.taskDefinitionArn]
    }))

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [executionRole.roleArn, ecsTaskRole.roleArn]
    }))

    lambdaExecutionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));

    launcherLambda.addEnvironment("FGB_TASKDEF_ARN", taskDef.taskDefinitionArn)
    launcherLambda.addEnvironment("FGB_CLUSTER_NAME", cluster.clusterName)
    launcherLambda.addEnvironment("FGB_SUBNETS", vpcConfig.subnets)
    launcherLambda.addEnvironment("FGB_SECURITYGROUPS", sg.securityGroupId)

    new cdk.CfnOutput(this, "TriggerJobQueue", {
      value: jobQueue.queueUrl,
      description: "Queue to add the job start requests to"
    })
  }
}
