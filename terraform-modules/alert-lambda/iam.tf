#
# iam.tf
#


resource "aws_iam_policy" "lambda" {
  name        = "log-alerts-lambda"
  description = "policy for lambda to read cloudwatch"
  policy      = data.aws_iam_policy_document.lambda.json
}


resource "aws_iam_role" "lambda" {
  name               = "log-alerts-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}


resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.lambda.name
  policy_arn = aws_iam_policy.lambda.arn
}


