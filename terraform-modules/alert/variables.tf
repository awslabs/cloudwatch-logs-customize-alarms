#
# variables.tf
#


## required variables


variable "env" {
  description = "environment short name (e.g., \"dev\")"
  type        = string
}

variable "lambda_arn" {
  description = "ARN for lambda (should be the alerts lambda)"
  type        = string
}

variable "log_group_name" {
  description = "log group name for the metric"
  type        = string
n}

variable "metric_name" {
  description = "metric name"
  type        = string
}

variable "name" {
  description = "name"
  type        = string
}

variable "namespace" {
  description = "log group namespace"
  type        = string
}

variable "pattern" {
  description = "pattern for metric filter"
  type        = string
}

variable "project" {
  description = "project name"
  type        = string
}


## variables with defaults


variable "description" {
  default     = ""
  description = "description for alarm"
  type        = string
}

variable "lambda_function_name" {
  default     = "log-alerts"
  description = "lambda function name; typically, \"log-alerts\""
  type        = string
}


variable "region" {
  default     = "us-east-1"
  description = "AWS region (e.g., \"us-east-1\")"
  type        = string
}


