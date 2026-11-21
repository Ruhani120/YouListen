package com.youlisten.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Background threads for song matching and playlist transfer.
 * Kept small on purpose: YouTube's quota, not CPU, is the bottleneck.
 * (The UI talks about an SQS worker: this executor sits behind a single method call,
 * so it can be swapped for an SQS consumer later without touching the controllers.)
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "jobExecutor")
    public Executor jobExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("youlisten-job-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        return executor;
    }
}
