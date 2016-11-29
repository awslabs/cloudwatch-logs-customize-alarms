
var aws = require('aws-sdk');
var cwl = new aws.CloudWatchLogs();

var ses = new aws.SES();

exports.handler = function(event, context) {
    var message = JSON.parse(event.Records[0].Sns.Message);
    var alarmName = message.AlarmName;
    var oldState = message.OldStateValue;
    var newState = message.NewStateValue;
    var reason = message.NewStateReason;
    var requestParams = {
        metricName: message.Trigger.MetricName,
        metricNamespace: message.Trigger.Namespace
    };
    cwl.describeMetricFilters(requestParams, function(err, data) {
        if(err) console.log('Error is:', err);
        else {
            console.log('Metric Filter data is:', data);
    	    getLogsAndSendEmail(message, data);
        }
    });
};


function getLogsAndSendEmail(message, metricFilterData) {
    var timestamp = Date.parse(message.StateChangeTime);
    var offset = message.Trigger.Period * message.Trigger.EvaluationPeriods * 1000;
    var metricFilter = metricFilterData.metricFilters[0];
    var parameters = {
        'logGroupName' : metricFilter.logGroupName,
        'filterPattern' : metricFilter.filterPattern ? metricFilter.filterPattern : "",
         'startTime' : timestamp - offset,
         'endTime' : timestamp
    };
    cwl.filterLogEvents(parameters, function (err, data){
        if (err) {
            console.log('Filtering failure:', err);
        } else {
            console.log("===SENDING EMAIL===");

            var email = ses.sendEmail(generateEmailContent(data, message), function(err, data){
                if(err) console.log(err);
                else {
                    console.log("===EMAIL SENT===");
                    console.log(data);
                }
            });
        }
    });
}

function generateEmailContent(data, message) {
    var events = data.events;
    console.log('Events are:', events);
    var style = '<style> pre {color: red;} </style>';
    var logData = '<br/>Logs:<br/>' + style;
    for (var i in events) {
        logData += '<pre>Instance:' + JSON.stringify(events[i]['logStreamName'])  + '</pre>';
        logData += '<pre>Message:' + JSON.stringify(events[i]['message']) + '</pre><br/>';
    }
    
    var date = new Date(message.StateChangeTime);
    var text = 'Alarm Name: ' + '<b>' + message.AlarmName + '</b><br/>' + 
               'Runbook Details: <a href="http://wiki.mycompany.com/prodrunbook">Production Runbook</a><br/>' +
               'Account ID: ' + message.AWSAccountId + '<br/>'+
               'Region: ' + message.Region + '<br/>'+
               'Alarm Time: ' + date.toString() + '<br/>'+
               logData;
    var subject = 'Details for Alarm - ' + message.AlarmName;
    var emailContent = {
        Destination: {
            ToAddresses: ["Add destination email here"]
        },
        Message: {
            Body: {
                Html: {
                    Data: text
                }
            },
            Subject: {
                Data: subject
            }
        },
        Source: 'Add source email here'
    };
    
    return emailContent;
}