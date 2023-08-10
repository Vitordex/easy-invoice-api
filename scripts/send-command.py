import sys
import boto3

instanceId = sys.argv[1]
GITLAB_USER = sys.argv[2]
GITLAB_PASS = sys.argv[3]
EASY_INVOICE_DB_PASSWORD = sys.argv[4]
EASY_INVOICE_EMAIL_PASSWORD = sys.argv[5]
COMMAND_COMMENT = sys.argv[6]

ec2 = boto3.client('ssm')
ec2.send_command(
    InstanceIds=[instanceId], DocumentName='AWS-RunShellScript', Comment=COMMAND_COMMENT, Parameters={
        "commands":[
            f"export GITLAB_USER={GITLAB_USER}",
            f"export GITLAB_PASS={GITLAB_PASS}",
            f"export EASY_INVOICE_DB_PASSWORD={EASY_INVOICE_DB_PASSWORD}",
            f"export EASY_INVOICE_EMAIL_PASSWORD={EASY_INVOICE_EMAIL_PASSWORD}",
            "cd /home/ec2-user", 
            "bash ./pull.sh"
        ]
    }
)