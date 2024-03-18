#
# main.tf
#

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Name        = "cloudwatch-logs-customize-alarms"
      Environment = var.env
    }
  }
}

