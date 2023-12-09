import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';
import { aws_ecs as ecs } from 'aws-cdk-lib';
import { aws_iam as iam } from 'aws-cdk-lib';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FgBootStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // should have policy to cycle out "dev" builds?
    // this bucket containst the app builds as .zip files
    const bucket = new s3.Bucket(this, 'FgBootBucket', {
      versioned: true
    })

    // put jobs to this queue
    const jobQueue = new sqs.Queue(this, 'FgBootJobQueue', {
      visibilityTimeout: cdk.Duration.minutes(5)
    })


    // this lambda wakes up from sqs...
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });

    const launcherLambda = new lambda.Function(this, "FgBootLauncherLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../launcher"),
      role: lambdaExecutionRole,
    })


    jobQueue.grantConsumeMessages(launcherLambda)
    launcherLambda.addEventSource(new lambdaEventSources.SqsEventSource(jobQueue))


    // and then launcher work in fargate cluster

    const cluster = new ecs.Cluster(this, 'FgBootCluster');
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com")
    })

    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      // dupe principal?
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')

    })
    bucket.grantRead(ecsTaskRole)


    const taskDef = new ecs.FargateTaskDefinition(this, 'FgBootTaskDef', {
      executionRole: executionRole,
      taskRole: ecsTaskRole

    })

    // can reuse the same image for all the apps
    const container = taskDef.addContainer('FgBootContainer', {
      image: ecs.ContainerImage.fromRegistry('fgbootimg')
    })



    // lambda can run it

    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ["ecs:RunTask"],
      resources: [taskDef.taskDefinitionArn]
    }))
    launcherLambda.addEnvironment("FGB_TASKDEF_ARN", taskDef.taskDefinitionArn)

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
