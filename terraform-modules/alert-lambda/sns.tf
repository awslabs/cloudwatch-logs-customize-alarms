#
# sns.tf
#
#   we need alerting on the lambda itself, as a failsafe
#
#   if the lambda itself fails for any reason, it is likely no email or other alerts will
#   ever be sent - i.e., the devs will have no way of knowing an error has occurred -
#   perhaps in prod - at all!
#
#   herein we define a log alert on the lambda itself; it is advisable that this be tested
#   periodically (any "test" run with bad data should do)
#
#   by design, alerts here should email the entire development team when any errors occur,
#   or, at least, all of devops - and any emails here should be investigated immediately,
#   as they represent error messages which were never delivered to developers; if the
#   alarm is in the dev account (it may be hard to tell without inspecting the email body,
#   since all alerts will come from no-reply@sns.amazonaws.com), it should still be
#   considered relatively urgent, since it could potentially block development; in all
#   cases, after such triage, developers should be notified of the missed alerts and
#   linked to logs (by email, chat, or via links in a bug ticket as appropriate)
#


resource "aws_sns_topic" "failsafe" {
  name = "alerting-failures"
}


resource "aws_lambda_function_event_invoke_config" "failsafe" {
  function_name = aws_lambda_function.alerts.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.failsafe.arn
    }
  }
}


resource "aws_sns_topic_subscription" "devops" {
  topic_arn = aws_sns_topic.failsafe.arn
  protocol  = "email"
  endpoint  = var.failsafe_email
}


