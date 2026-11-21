package com.youlisten.transfer;

/** What the background worker needs for one track, copied out of the database (no lazy entities). */
public record TransferWorkItem(Long id, String videoId, String title) {
}
