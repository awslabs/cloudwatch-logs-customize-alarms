#
# metric_filter.tf
#

resource "aws_cloudwatch_log_metric_filter" "x" {
  name           = var.name
  pattern        = var.pattern
  log_group_name = var.log_group_name

  metric_transformation {
    name      = var.metric_name
    namespace = var.namespace
    unit      = "Count"
    value     = "1"
  }
}


