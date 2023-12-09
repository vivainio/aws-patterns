FROM mcr.microsoft.com/dotnet/runtime:8.0-jammy
RUN apt-get update && \
    apt-get install -y python3 python3-venv python-is-python3 unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* 


WORKDIR /app
COPY fgboot_launch.py .
COPY requirements_container.txt .
RUN python3 -m venv venv
RUN venv/bin/pip install -r requirements_container.txt
ENTRYPOINT ["/app/venv/bin/python3", "/app/fgboot_launch.py"]