const redis = require('redis');

let redisClient;

(async () => {
  redisClient = redis.createClient({
    host: '127.0.0.1',
    port: '6379',
  });
  
  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
  console.log('Redis Connected');

  await redisClient.flushAll();
  console.log('Redis Cleared');
})();

module.exports = redisClient;