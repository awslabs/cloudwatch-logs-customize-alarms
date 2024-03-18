#
# main.tf
#

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Environment = var.env
      Module      = "alert-metric"
    }
  }
}

