curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -;
sudo yum -y install nodejs;
sudo yum -y install gcc-c++ make;

curl https://s3.amazonaws.com/aws-cloudwatch/downloads/latest/awslogs-agent-setup.py -O
sudo python ./awslogs-agent-setup.py --region us-east-1