#
# sns.tf
#


data "aws_lambda_function" "alerts" {
  function_name = var.lambda_function_name
}


resource "aws_sns_topic" "x" {
  name = "${var.project}-${var.metric_name}-${var.env}"
}


resource "aws_sns_topic_subscription" "invoke_with_sns" {
  topic_arn = aws_sns_topic.x.arn
  protocol  = "lambda"
  endpoint  = data.aws_lambda_function.alerts.arn
}


resource "aws_lambda_permission" "allow_cloudwatch" {
  statement_id  = "${var.project}-${var.metric_name}-${var.env}"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.alerts.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.x.arn
}


