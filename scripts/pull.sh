cd easy-invoice;

git pull https://${GITLAB_USER}:${GITLAB_PASS}@gitlab.com/roo.novais/easy-invoice.git dev;

npm i --production;

pm2 delete 0;

pm2 start --name easy-invoice-api bin/www;