package com.youlisten.transfer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;

/**
 * Sends a small "transfer finished" event to Amazon SQS.
 * Does nothing when TRANSFER_EVENTS_QUEUE_URL is not set (for example on a
 * laptop),
 * and never throws: a transfer must not fail because AWS is unreachable.
 */
@Component
@Slf4j
public class TransferEventPublisher {

    private final String queueUrl;
    private final SqsClient sqs;

    public TransferEventPublisher(
            @Value("${TRANSFER_EVENTS_QUEUE_URL:}") String queueUrl,
            @Value("${AWS_REGION:ap-southeast-2}") String region) {
        this.queueUrl = queueUrl;
        this.sqs = queueUrl.isBlank() ? null : SqsClient.builder().region(Region.of(region)).build();
    }

    public void publish(Long jobId, String status, int transferred, int failed) {
        if (sqs == null) {
            return;
        }
        try {
            String body = String.format(
                    "{\"jobId\":%d,\"status\":\"%s\",\"transferred\":%d,\"failed\":%d}",
                    jobId, status, transferred, failed);
            sqs.sendMessage(SendMessageRequest.builder().queueUrl(queueUrl).messageBody(body).build());
        } catch (RuntimeException e) {
            log.warn("Could not send transfer event to SQS: {}", e.getMessage());
        }
    }
}