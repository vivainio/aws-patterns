""" Simple, fast and fun task runner, not unlike gulp / grunt (but zero dep)"""
import sys
import subprocess
import os
import textwrap
import json

PACKAGE = "fgboot"


def do_docker(args):
    os.chdir("container")
    c("docker build -t fgbootimg:LATEST .")
    c("docker run -i docker.io/library/fgbootimg:LATEST")


def do_test(args):
    os.chdir("container")
    c("pytest")


def do_format(args):
    c("ruff format .")


def do_deploy(args):
    os.chdir("cdk")
    c("cdk deploy --format=json --profile dev")


def do_ecrpush(args):
    os.chdir("container")
    c("aws ecr-public get-login-password --region us-east-1 --profile dev | docker login --username AWS --password-stdin public.ecr.aws/i4s7m2y3")
    c("docker build -t fgboot .")
    c("docker tag fgboot:latest public.ecr.aws/i4s7m2y3/fgboot:latest")
    c("docker push public.ecr.aws/i4s7m2y3/fgboot:latest")


def get_outputs():
    stacks = cap_json("aws cloudformation describe-stacks --stack-name FgbDemoStack --profile dev")
    print(stacks)

    outputs = {o["OutputKey"]: o["OutputValue"] for o in stacks["Stacks"][0]["Outputs"]}
    print(outputs)
    return outputs

def do_send(args):
    out = get_outputs()







def default():
    show_help()


# library functions here (or in own module, whatever, I don't care)


def run_node_bin(scriptname: str, arg: str):
    c(rf"node_modules\.bin\{scriptname} {arg}")


def c_spawn(cmd, cwd):
    print(">", cmd)
    subprocess.Popen(cmd, cwd=cwd, shell=True)

def cap_json(s):
    print(">",s)
    return json.loads(os.popen(s).read())


def c(cmd):
    print(">", cmd)
    subprocess.check_call(cmd, shell=True)


def c_ignore(cmd):
    print(">", cmd)
    subprocess.call(cmd, shell=True)


def c_dir(cmd, dir):
    print("%s > %s" % (dir, cmd))
    subprocess.check_call(cmd, cwd=dir, shell=True)


# scaffolding starts. Do not edit below


def show_help():
    g = globals()
    print(
        "Command not found, try",
        sys.argv[0],
        " | ".join([n[3:] for n in g if n.startswith("do_")]),
        "| <command> -h",
    )


def main():
    """Launcher. Do not modify"""
    if len(sys.argv) < 2:
        default()
        return
    func = sys.argv[1]
    f = globals().get("do_" + func)
    if sys.argv[-1] == "-h":
        print(
            textwrap.dedent(f.__doc__).strip()
            if f.__doc__
            else "No documentation for this command"
        )
        return
    if not f:
        show_help()
        return
    f(sys.argv[2:])


if __name__ == "__main__":
    main()
