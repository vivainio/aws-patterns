from moto import mock_s3
import fgboot_launch
from supermoto import resources
import io
import zipfile


def create_zip_in_memory(files):
    # Create an in-memory byte stream
    in_memory_zip = io.BytesIO()

    # Create a ZipFile object with the in-memory byte stream
    with zipfile.ZipFile(in_memory_zip, mode="w") as zipf:
        # Add files to the zip file
        for file_name, file_content in files.items():
            zipf.writestr(file_name, file_content)

    # Get the content of the in-memory byte stream
    in_memory_zip.seek(0)
    zip_content = in_memory_zip.read()
    return zip_content


@mock_s3
def test_download():
    b = resources.s3_bucket("testbucket")
    zipcont = create_zip_in_memory({"boot.py": "print('hello from app')"})
    b("path/to/file.zip", zipcont)
    fgboot_launch.main("s3://testbucket/path/to/file.zip")
