# Install Node.JS
curl --silent --location https://rpm.nodesource.com/setup_${NODEJS_VERSION}.x | sudo bash -;
sudo yum -y install nodejs;
sudo yum -y install gcc-c++ make;

#Install SSM Agent
mkdir /tmp/ssm
curl https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm -o /tmp/ssm/amazon-ssm-agent.rpm
sudo yum install -y /tmp/ssm/amazon-ssm-agent.rpm
sudo systemctl stop amazon-ssm-agent
sudo amazon-ssm-agent -register -code "${SSM_ACTIVATION_CODE}" -id "${SSM_ACTIVATION_ID}" -region "${AWS_RES_REGION}"
sudo systemctl start amazon-ssm-agent

#Install Cloudwatch Agent
mkdir /var/log/${API_NAME}/
sudo chmod +755 /var
sudo chmod +755 /var/log
sudo chmod +777 /var/log/${API_NAME}

curl https://s3.amazonaws.com/aws-cloudwatch/downloads/latest/awslogs-agent-setup.py -O
curl https://s3.amazonaws.com/aws-cloudwatch/downloads/latest/AgentDependencies.tar.gz -O
tar xvf AgentDependencies.tar.gz -C /tmp/
sudo python ./awslogs-agent-setup.py --region ${AWS_RES_REGION} --dependency-path /tmp/AgentDependencies