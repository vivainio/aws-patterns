import boto3
import subprocess
import os

BUCKET = "demo_bucket"
path = "s3://demo_bucket/my/app.zip"
from pathlib import Path


def s3_client():
    return boto3.client("s3")


appdir = Path("/app")


def main(path):
    s3 = s3_client()
    assert path.startswith("s3://")
    path = path.removeprefix("s3://")
    bucket, key = path.split("/", 1)
    s3.download_file(bucket, key, "/app/dl.zip")
    subprocess.run(["unzip", "-o", appdir / "dl.zip", "-d", appdir], check=True)
    # the zip has to contain boot.py in the root. It gets run in a virtual env created for this launcher script
    assert os.path.isfile("/app/boot.py")
    subprocess.run(["python", "/app/boot.py"], cwd="/app", check=True)


if __name__ == "__main__":
    main(path)
