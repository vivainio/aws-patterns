import boto3
import os


def ecs():
    return boto3.client("ecs")


def handler(event, context):
    print("Received event:", event)


    cluster = os.environ["FGB_CLUSTER_NAME"]
    taskdef = os.environ["FGB_TASKDEF_ARN"]
    subnets = os.environ["FGB_SUBNETS"].split(",")
    security_groups = os.environ["FGB_SECURITYGROUPS"].split(",")
    network_configuration = {
        "awsvpcConfiguration": {"subnets": subnets, "securityGroups": security_groups}
    }
    
    overrides = {
        "containerOverrides": [
            {
                "name": os.environ["FGB_CONTAINERNAME"],
                "environment": [
                    {"name": "FGB_PATH", "value": "myapp.zip"},
                    # Add more environment variables as needed
                ],
            }
        ]
    }
    
    client = ecs()

    client.run_task(
        cluster=cluster,
        taskDefinition=taskdef,
        networkConfiguration=network_configuration,
        launchType="FARGATE",
        overrides=overrides,
    )
