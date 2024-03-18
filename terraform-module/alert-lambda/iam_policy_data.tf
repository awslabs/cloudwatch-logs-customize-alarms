#
# iam_policy_data.tf
#


data "aws_caller_identity" "current" {}
locals {
  account_id = data.aws_caller_identity.current.account_id
}


## IAM policy for lambda role assume
data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}



## IAM policy for lambda
data "aws_iam_policy_document" "lambda" {


  # CloudWatch - read permissions for all logstreams
  statement {
    effect = "Allow"

    actions = [
      "logs:DescribeLogStreams",
      "logs:DescribeMetricFilters",
      "logs:FilterLogEvents"
    ]

    resources = ["*"] # lambda must have read access to most/all logs
  }


  # CloudWatch - lambda logs
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:CreateLogGroup",
      "logs:PutLogEvents",
      "logs:PutRetentionPolicy",
    ]

    resources = [
      # seemingly, cannot use aws_lambda_function.alerts.logging_config[0]
      "arn:aws:logs:${var.region}:${local.account_id}:log-group:/aws/lambda/log-alerts:*"
    ]
  }


  # SES permissions
  statement {
    effect = "Allow"

    actions = [
      "ses:SendEmail"
    ]

    resources = ["*"]
  }


  # SNS - notifying the lambda
  statement {
    effect = "Allow"

    actions = [
      "sns:Receive",
      "sns:GetTopicAttributes",
      "sns:Subscribe",
      "sns:ListSubscriptionsByTopic",
    ]

    resources = ["*"]  # lambda should recieve any log metric notification
  }


  # SNS permissions - failsafe (notifying *from* the lambda, on failure)
  statement {
    effect = "Allow"

    actions = [
      "sns:ConfirmSubscription",
      "sns:Subscribe",
      "sns:Publish"
    ]

    resources = [aws_sns_topic.failsafe.arn]
  }

}


