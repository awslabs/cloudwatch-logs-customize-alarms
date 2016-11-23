# Cloudwatch Logs Customize alarms

### Package cloudwatch-logs-customize-alarms

Copyright 2016- Amazon.com, Inc. or its affiliates. All Rights Reserved.

## Introduction

When you get an alarm, you want enough information to decide whether it needs immediate attention or not. You also want to customize the alarm text to operational needs. The **CloudWatch Logs Customize Alarms** is a Lambda function that helps in reading the logs from CloudWatch Logs during an alarm and send a customized email through SES

## Flow of Events

![Flow of events](https://s3.amazonaws.com/aws-cloudwatch/downloads/cloudwatch-logs-customize-alarms/demo-2.png)

## Setup Overview

Lambda function is written in Node.js. We do have a dependency on the latest aws sdk which includes the metrics to logs feature. Hence we create a deployment package. You can create a new Lambda function, and copy the code in index.js from this repository to your function. See 'Configurable parameters' section below.  

### Pre-requisite

* CloudWatch Logs has a Log group with a metric filter.
* A CloudWatch Alarm is created to trigger when that metric exceeds a threshold.
* SES domain is created and verified

### Triggers

* The Lambda function is triggered on a SNS event.
* You need to provide the SNS topic.

### Authorization

Since there is a need here for various AWS services making calls to each other, appropriate authorization is required.  This takes the form of configuring an IAM role, to which various authorization policies are attached.  This role will be assumed by the Lambda function when running. The below two permissions are required:
 
1.CloudWatch Logs permits Lambda to call describeMetricFilters and filterLogEvents api. Note that we have given full CloudWatch Logs access, but it is recommened that you only give permissions to call specific api's.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:*"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
```

2.SES permits Lambda to send a customized email. Note that we have given full SES access, but it is recommended that you only give permissions to send an email.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### Lambda Function

***Configurable parameters:***

1. **accessKeyId:** The AWS access key.
2. **secretAccesskey:** AWS secret access key.
3. **region:** The AWS region to send service requests to. 
4. **Destination** - The destination email address where email needs to be send.
5. **Source** - The source email address sending the email.

For more information visit the SES documentation [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html)

***Instructions:***

* Handler: The name of the main code file. In this example, we have used index as the name of the handler.
* When the metric (from the logs metric filters) reaches a threshold an alarm is trigerred.
* Once Alarm invokes the SNS topic, Lamnbda function is invoked and it reads the metricName and metricNamespace from the alarm.
* It then calls describeMetricFilters to get the filterPattern.
* Then Lambda calls filterLogEvents to get the relevant logs.
* SES uses those filtered logs and additional customizations to send an email.

### Lambda Configuration

This Lambda function was created with runtime Node.js 4.3. It has been tested with 128 MB and 3 seconds timeout. No VPC was used. You can change the configuration based on your testing.

## Getting started

1. Download the zip file located at dist/customize-alarms.
2. Unzip the file. You will see a index.js file and node_modules folder. Index.j is the Lambda function and node_mdoules contain the specific version of AWS SDK.
3. Open index.js in editor of your choice and add the information as specified in the 'Configuration parameters'.
5. Once done with the changes in Lamhda, zip the node.js file and node_modules folder.
6. Upload the zip file to the Lambda function
