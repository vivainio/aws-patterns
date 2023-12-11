# fargate-bootstrap

Micro-PaaS where you:

- Upload your application as a zip to a bucket
- Application has to contain "boot.py". This is run when the Fargate task is launched
- Fargate task is launched by either putting a starter message to sqs queue, or invoking the launcher lambda directly

# What's the point?

There is no need to create or upload your own container image. There is a public container image that contains Ubuntu, Python, .NET 8 and the bootstrapper code. Just upload your code to the bucket and go.

This is similar to how you would use AWS CodeBuild, but is much cheaper.


# Message format

You need to send the "job" message to sqs or lambda as a payload.

Body must contain the path to application at top level under "fgboot" key:

I
```json

{
    "fgboot": {
        "path": "path/to/app.zip",
        "batchkey": "somekey",
        "cpu": 512,
        "ram": 1024
    },
    "otherstuff": [1,2],
    "evenmorestuff": ["foo", "bar"]
}
```


The whole payload (including "fgboot", "otherstuff", "evenmorestuff") will be available in FGB_BODY environment variable.

In case of sqs, messages containing the same `batchkey`` will be sent as an array to the same Fargate task, instead of launching individual tasks in parallel. This can lower the cost of quick running tasks with expensive setup (e.g. a big source .zip), or be used as a throttle.

