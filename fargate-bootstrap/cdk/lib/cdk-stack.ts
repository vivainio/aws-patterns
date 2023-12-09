import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { aws_s3 as s3 } from 'aws-cdk-lib';
import { aws_sqs as sqs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_lambda_event_sources as lambdaEventSources } from 'aws-cdk-lib';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class FgBootStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // should have policy to cycle out "dev" builds?
    // this bucket containst the app builds as .zip files
    new s3.Bucket(this, 'FgBootBucket', {
      versioned: true
    })

    const jobQueue = new sqs.Queue(this, 'FgBootJobQueue', {
      visibilityTimeout: cdk.Duration.minutes(5)
    })

    const launcherLambda = new lambda.Function(this, "FgBootLauncherLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset("../launcher")
    })

    jobQueue.grantConsumeMessages(launcherLambda)
    launcherLambda.addEventSource(new lambdaEventSources.SqsEventSource(jobQueue))


    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
