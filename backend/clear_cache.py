import asyncio
import redis.asyncio as redis

async def main():
    r = redis.Redis(host='localhost', port=6379, db=0)
    await r.flushdb()
    print("Redis cache cleared!")
    await r.close()

if __name__ == "__main__":
    asyncio.run(main())
