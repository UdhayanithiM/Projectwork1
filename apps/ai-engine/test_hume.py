from hume.stream import HumeStreamClient
from hume.models.config import FaceConfig

async def main():
    client = HumeStreamClient("YOUR_HUME_API_KEY")
    config = FaceConfig()
    async with client.connect([config]) as socket:
        result = await socket.send_file("sample.mp4")
        print(result)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
