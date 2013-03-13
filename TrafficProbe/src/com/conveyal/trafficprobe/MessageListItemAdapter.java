package com.conveyal.trafficprobe;

import android.content.Context;

public class MessageListItemAdapter extends TwoLineArrayAdapter<Message> {
    public MessageListItemAdapter(Context context, Message[] employees) {
        super(context, employees);
    }

    @Override
    public String lineTwoText(Message e) {
        return e.messageBody;
    }

    @Override
    public String lineOneText(Message e) {
        return e.received.toLocaleString();
    }
}
