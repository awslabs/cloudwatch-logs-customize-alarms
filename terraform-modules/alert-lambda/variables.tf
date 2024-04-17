#
# variables.tf
#

variable "domain" {
  description = "email domain used by lambda alert emails (e.g., \"dev.your-domain.com\" for \"From: alerts@dev.your-domain.com\")"
  type        = string
}

variable "env" {
  description = "environment short name (e.g., \"dev\", \"prod\", etc.)"
  type        = string
}

variable "failsafe_email" {
  description = "SNS \"email\" subscription endpoint; i.e., failsafe notification audience (e.g., \"devops@your-domain.com\")"
  type        = string
}

variable "region" {
  description = "AWS region (e.g., \"us-east-1\")"
  type        = string
}

variable "reply_to" {
  description = "the \"reply to\" email (e.g., \"devops@your-domain.com\")"
  type        = string
}

variable "to" {
  description = "email \"To:\" address, to which lambda will send emails"
  type        = string
}

