#
# alarm.tf
#

resource "aws_cloudwatch_metric_alarm" "x" {
  alarm_name                = var.name # same name as corresponding metric
  alarm_actions             = [aws_sns_topic.x.arn]
  comparison_operator       = "GreaterThanOrEqualToThreshold"
  evaluation_periods        = 1
  metric_name               = var.metric_name
  namespace                 = var.namespace
  period                    = 10
  statistic                 = "Sum"
  threshold                 = 1
  alarm_description         = var.description
  insufficient_data_actions = []
}

