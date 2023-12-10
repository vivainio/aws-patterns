# fargate-bootstrap

Micro-PaaS where you:

- Upload your application as a zip to a bucket
- Application has to contain "boot.py". This is run when the Fargate task is launched
- Fargate task is launched by either putting a starter message to sqs queue, or invoking the launcher lambda directly

# What's the point?

There is no need to create your own container image. There is a public container image that contains Ubuntu, Python, .NET 8 and the bootstrapper code. Just upload your code to 
the bucket and go.

This is not dissimilar to how you would use AWS CodeBuild, but it's much cheaper.

