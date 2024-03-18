#
# lambda.tf
#


data "archive_file" "lambda" {
  type        = "zip"
  source_file = "${path.module}/../../index.mjs"
  output_path = "lambda.zip"
}


resource "aws_lambda_function" "alerts" {
  filename      = "lambda.zip"
  function_name = "log-alerts"
  handler       = "index.handler"
  role          = aws_iam_role.lambda.arn
  runtime       = "nodejs20.x"

  environment {
    variables = {
      ENV      = var.env
      SOURCE   = "alerts@${var.domain}"
      TO       = var.to
      REPLY_TO = var.reply_to
    }
  }

  source_code_hash = data.archive_file.lambda.output_base64sha256
}


