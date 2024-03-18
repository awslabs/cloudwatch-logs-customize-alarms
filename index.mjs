import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { FilterLogEventsCommand, CloudWatchLogs, CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
/*
 * alerting lambda
 *
 *   ** purpose **
 *
 *   this lambda should, given an AWS EventBridge "event", which is a CloudWatch alarm/
 *   alert, parse the event to determine the relevant log streams, and send a custom email
 *   which links to those log streams
 *
 *   ** failsafe **
 *
 *   because this lambda could fail, hence not sending an email, a traditional CloudWatch
 *   alert/alarm MUST be set on this lambda itself; failure to do so could result in
 *   serious errors being missed
 *
 *     note: the lambda should never be triggered from its own logs to prevent loops
 *
 *   ** motivation **
 *
 *   the shortcomings of "native" AWS CloudWatch Alertings (alarms notifying SES directly)
 *   are myriad; the main issue is simply that the alarms do not link to the relevant
 *   logs, behavior one might expect from log-based alerting, especially if coming from
 *   competing technologies like ELK/Elastic, DataDog, AWS OpenSearch, New Relic, et al
 *
 *   using SES directly also means that the email "From" addresses will be custom-
 *   domained, in lieu of the generic AWS alerts, and in general, lambdas are flexible;
 *   one could in theory customize the alerts in whatever manner (such as writing to a
 *   g-chat or slack channel, instead of sending email)
 *
 */


// email variables - populate from eponymous environment variables
const TO = [process.env.TO]
const SOURCE = process.env.SOURCE // named after API field
const REPLY_TO = [process.env.REPLY_TO]
const CC = process.env.CC ? [process.env.CC] : []


// handler - the fundamental export lambda expects / the main logic
export const handler = async function (event, context) {
    console.log("==STARTING==");
    console.log('event:', event);

    // the CloudBridge event should contain an SNS message
    const message = JSON.parse(event.Records[0].Sns.Message);
    console.log('message:', message);

    // from the SNS message, we can determine the metric filter that triggered the alarm
    const metricFilterData = await getFilterData(
        message.Trigger.MetricName,
        message.Trigger.Namespace
    );
    console.log('metricFilterData:', metricFilterData);
    const metricFilter = metricFilterData.metricFilters[0];
    const logGroupName = metricFilter.logGroupName;
    console.log('metricFilter:', metricFilter);

    // determine the time-range we will apply to this filter in our search
    console.log('grabbing filter params...');
    console.log('message.Trigger.Period: ', message.Trigger.Period);
    let offset = message.Trigger.Period * message.Trigger.EvaluationPeriods * 1000;
    offset += 20 * 1000; // the alarm trigger time can be off by a few seconds
    const endTime = Date.parse(message.StateChangeTime);
    const startTime = endTime - offset;

    // filter logs for matching events
    const filterParameters = {
        logGroupName: logGroupName,
        filterPattern: metricFilter.filterPattern,
        startTime: startTime,
        endTime: endTime,
        limit: 50
    };
    console.log('filterParameters:', filterParameters);
    const data = await getLogEvents(filterParameters);
    console.log('filter data:', data);
    console.log('events: ', data.events);

    // send email via SES with info from SNS message and cloudwatch events
    await sendEmail(
        message,
        data.events,
        filterParameters
    );

    // return 200
    return {
        statusCode: 200,
        body: JSON.stringify('success')
    };
};


// getFilterData - given an SNS message, queries CloudWatch for the filter data
const getFilterData = async function (metricName, metricNamespace) {
    console.log("===DESCRIBING METRIC FILTERS===");
    const requestParams = {
        metricName: metricName,
        metricNamespace: metricNamespace
    }
    console.log('requestParams:', requestParams)
    const cwl = new CloudWatchLogs();
    return await cwl.describeMetricFilters(requestParams);
}


// getLogEvents - given the SES message and filter data, filter for matching events
const getLogEvents = async function (parameters) {
    console.log("===FILTERING LOG EVENTS===");
    const client = new CloudWatchLogsClient();
    const command = new FilterLogEventsCommand(parameters);
    const data = await client.send(command);
    return data;
}


// createLinkAlarm - creates link to the alarm itself
function createLinkAlarm(alarmName, region = 'us-east-1') {
    // https://en.wikipedia.org/wiki/URI_fragment
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#application/x-www-form-urlencoded-encoding-algorithm
    // https://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
    // https://stackoverflow.com/a/5433216/19009041
    const url = `https://${region}.console.aws.amazon.com/cloudwatch/home`;
    let query = `region=${region}`;
    let fragment = 'alarmsV2:alarm/' + alarmName.replace(' ', '+');
    return url + '?' + query + '#' + fragment;
}


// createFilterFragment - creates fragment for cloudwatch logs links
function createFilterFragment(
    logGroupName,
    logStreamName,
    startTime = null,
    endTime = null
) {
    // https://docs.microfocus.com/OMi/10.62/Content/OMi/ExtGuide/ExtApps/URL_encoding.htm
    function encodeStringLiteral(x) {
        return encodeURIComponent(x).replaceAll('%', '$');
    }
    let fragment = 'logsV2:log-groups/log-group/' + encodeStringLiteral(logGroupName);
    if (startTime || endTime || logStreamName) {
        fragment += '/log-events';
    }
    if (logStreamName) {
        fragment += '/' + encodeURIComponent(logStreamName);
    }
    if (startTime || endTime) {
        let fragQuery = '?';
        if (startTime) {
            fragQuery += `start=${startTime}`;
            if (endTime) fragQuery += '&';
        }
        if (endTime) fragQuery += `end=${endTime}`;
        fragment += encodeStringLiteral(fragQuery);
    }
    return fragment;
}


// createLinkLogs - creates link to logs in CloudWatch
function createLinkLogs(
    logGroupName,
    logStreamName = null,
    region = 'us-east-1',
    startTime = null,
    endTime = null
) {
    const url = `https://${region}.console.aws.amazon.com/cloudwatch/home`;
    let query = `region=${region}`;
    let fragment = createFilterFragment(logGroupName, logStreamName, startTime, endTime);
    return url + '?' + query + '#' + fragment;
}


// sendEmail - constructs and sends an email with a CloudWatch link to logs
const sendEmail = async function (message, events, filterParameters, region = 'us-east-1') {
    console.log("===GENERATING EMAIL===");

    // generate subject line
    const subject = message.AlarmName;

    // create email body content
    const style = '<style> pre {color: red;} </style>';
    const date = new Date(message.StateChangeTime);
    let logData = '<br/>log-group: <a href="' +
        createLinkLogs(filterParameters.logGroupName) +
        '">' + filterParameters.logGroupName + '</a><br/>';
    logData += 'events found: ' + JSON.stringify(events.length) + '<br/>';
    logData += '<a href="' +
        createLinkLogs(
            filterParameters.logGroupName,
            null,
            'us-east-1',
            filterParameters.startTime,
            filterParameters.endTime
        ) + '">' +
        'filter</a>: ' + JSON.stringify(filterParameters) + '<br/>';
    if (events.length > 0) logData += '<br/>Log events:<br/>' + style;
    for (let event of events) {
        const url = createLinkLogs(
            filterParameters.logGroupName,
            event.logStreamName,
            region,
            filterParameters.startTime,
            filterParameters.endTime
        );
        logData += '<i>stream: <a href="' + url + '">' + event.logStreamName + '</a></i>';
        logData += '<pre>' + event.message + '</pre><br/>';
    }
    const text = 'Alarm: <b><a href="' + createLinkAlarm(message.AlarmName) + '">' + message.AlarmName + '</a></b><br/>' +
        'Account ID: ' + message.AWSAccountId + '<br/>' +
        'Region: ' + message.Region + '<br/>' +
        'Alarm Time: ' + date.toString() + '<br/>' +
        '<br/><br/>' +
        logData;

    // create email send command
    const sendCmd = new SendEmailCommand(
        {
            Destination: {
                CcAddresses: CC,
                ToAddresses: TO
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: text,
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: text
                    },
                },
                Subject: {
                    Charset: "UTF-8",
                    Data: subject,
                },
            },
            Source: SOURCE,
            ReplyToAddresses: REPLY_TO
        }
    );
    console.log('generated email "command":', sendCmd);

    // email send
    console.log("===SENDING EMAIL===");
    const ses = new SESClient();
    const email = await ses.send(sendCmd);
    console.log('email:', email);
    console.log("===EMAIL SENT===");
}


