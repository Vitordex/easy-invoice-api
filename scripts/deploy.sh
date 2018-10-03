pip3 install awscli;
pip3 install boto3;

mkdir ~/.aws
touch ~/.aws/credentials;
touch ~/.aws/config;

echo "[default]
aws_access_key_id = ${AWS_ACCESS_KEY_ID}
aws_secret_access_key = ${AWS_SECRET_ACCESS_KEY}" >> ~/.aws/credentials

echo "[default]
output=json
region=us-east-1" >> ~/.aws/config

cat ~/.aws/credentials
cat ~/.aws/config

python ./scripts/send-command.py ${DEPLOY_INSTANCE_ID} ${GITLAB_USER} ${GITLAB_PASS} ${EASY_INVOICE_DB_PASSWORD} ${EASY_INVOICE_EMAIL_PASSWORD} ${COMMAND_COMMENT}