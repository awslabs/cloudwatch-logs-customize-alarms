# Cloudwatch Logs Customize alarms

### Package cloudwatch-logs-customize-alarms

Copyright 2016- Amazon.com, Inc. or its affiliates. All Rights Reserved.

## Introduction

When you get an alarm, you want enough information to decide whether it needs immediate attention or not. You also want to customize the alarm text to operational needs. The **CloudWatch Logs Customize Alarms** is a Lambda function that helps in reading the logs from CloudWatch Logs during an alarm and send a customized email through SES.

Though the lambda could do anything (alerting a chat channel, for example), a common expectation from developers from a log-based alarm is a link to the log event(s) which triggered the alarm. In this case, the lambda expects an SES domain and sends the email from a custom domain (e.g., "alerts@yourdomain.com").

## Flow of Events

![Flow of events](https://s3.amazonaws.com/aws-cloudwatch/downloads/cloudwatch-logs-customize-alarms/demo-2.png)

## Setup Overview

When cloudwatch alarms are triggered, a subscribed lambda may be run which takes the CloudBridge Event (in JSON) as its input. By parsing the event, one can determine which alarm was thrown, and send custom alerts, such as via AWS SES, using the aws sdk.

Lambda function is written in Node.js. We do have a dependency on the latest (v3) aws sdk. Hence, we create a deployment package. You can create a new Lambda function, and copy the code in index.js from this repository to your function. See 'Configurable parameters' section below.

### Pre-requisites

* CloudWatch Logs has a log-group with a metric filter.
* A CloudWatch Alarm is created to trigger when that metric exceeds a threshold.
* SES domain is created and verified

### Triggers

* The Lambda function is triggered on a SNS event.
* You need to provide the SNS topic.

### Authorization

Since there is a need here for various AWS services making calls to each other, appropriate authorization is required.  This takes the form of configuring an IAM role, to which various authorization policies are attached.  This role will be assumed by the Lambda function when running. The below two permissions are required:
 
1.CloudWatch Logs permits Lambda to call describeMetricFilters and filterLogEvents api. Note that we have given full CloudWatch Logs access, but it is recommended that you only give permissions to call specific api's.

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

Parameters are configurable as environment variables for the lambda.

1. `TO` - the address to which emails will be sent
2. `SOURCE` - the "From:" address on the emails
3. `REPLY_TO` - the reply address on the emails
4. `CC` - the "cc" list for the email (optional)

see: [SES docs](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/ses/)

***Instructions:***

* Handler: The name of the main code file. In this example, we have used index as the name of the handler.
* When the metric (from the logs metric filters) reaches a threshold an alarm is triggered.
* Once Alarm invokes the SNS topic, Lambda function is invoked and it reads the metricName and metricNamespace from the alarm.
* It then calls describeMetricFilters to get the filterPattern.
* Then Lambda calls filterLogEvents to get the relevant logs.
* SES uses those filtered logs and additional customizations to send an email.

### Lambda Configuration

This Lambda function was created with runtime Node.js 20. Recommended settings are 128 MB and 3 seconds timeout. Change the configuration based on your testing.

## Failsafe

If you are using this as your primary alerting mechanism, you may consider a simple "failsafe" alarm on the lambda itself, sent to your devops team. In this case, if the lambda somehow fails without sending an email, knowledge than an alert has been missed can still reach the devops/development teams.

## Getting started

1. Download the zip file located at dist/customize-alarms.
2. Unzip the file. You will see an index.js file and node_modules folder. Index.js is the Lambda function and node_mdoules contain the specific version of AWS SDK.
3. Open index.js in editor of your choice and add the information as specified in the 'Configuration parameters'.
5. Once done with the changes in Lambda, zip the node.js file and node_modules folder.
6. Upload the zip file to the Lambda function.
7. For ease of use, the index.js is also copied in the main directory here.

## Known Limitation

The Lambda function has the following limitation:
* The nextToken in filterLogEvents api call is ignored. For production use, the lambda function should be modified to query filterLogEvents again with the nextToken received from the previous call. We need to continue querying until we get a null nextToken. More information on the api can be found [here](http://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_FilterLogEvents.html).

## License Summary

This sample code is made available under the MIT license. 
