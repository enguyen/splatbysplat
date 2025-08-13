import asyncio
from playwright.async_api import async_playwright
import subprocess
import time

async def main():
    async with async_playwright() as p:
        # Start a web server
        server = subprocess.Popen(["python3", "-m", "http.server", "8000"])
        time.sleep(1)  # Give the server a moment to start

        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:8000")

            # Upload the .ply file
            async with page.expect_file_chooser() as fc_info:
                await page.locator("#splat-file").click()
            file_chooser = await fc_info.value
            await file_chooser.set_files("sample.ply")

            # Wait for the splat to be rendered
            await page.wait_for_timeout(2000)

            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot saved to jules-scratch/verification/verification.png")

        finally:
            await browser.close()
            server.kill()

if __name__ == "__main__":
    asyncio.run(main())
