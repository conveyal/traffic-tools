package com.conveyal.traffic.graph;

import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

public class StatsPool {
	
	public JedisPool pool;
	
	public StatsPool() {
		JedisPoolConfig config = new JedisPoolConfig();
		config.setTestOnBorrow(true);
		this.pool = new JedisPool(config, "localhost");
	}
}
