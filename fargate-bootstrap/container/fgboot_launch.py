import boto3
import subprocess
import os

from pathlib import Path


def s3_client():
    return boto3.client("s3")


appdir = Path("/app")


def main(bucket, path):
    print("Will download", bucket, path)
    s3 = s3_client()
    s3.download_file(bucket, path, "/app/dl.zip")
    subprocess.run(["unzip", "-o", appdir / "dl.zip", "-d", appdir], check=True)
    # the zip has to contain boot.py in the root. It gets run in a virtual env created for this launcher script
    assert os.path.isfile("/app/boot.py")
    subprocess.run(["python", "/app/boot.py"], cwd="/app", check=True)


if __name__ == "__main__":
    print(os.environ)
    main(os.environ["FGB_APPBUCKET"], os.environ["FGB_PATH"])
