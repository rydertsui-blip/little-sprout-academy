from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = "http://127.0.0.1:4197/?companion-preview=1"
OUT = Path(__file__).parent / "family-audit"
OUT.mkdir(parents=True, exist_ok=True)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    page = browser.new_page(viewport={"width": 1180, "height": 820}, device_scale_factor=1)
    errors: list[str] = []
    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_selector('[aria-label="陪伴小狗豆豆"]')
    page.screenshot(path=str(OUT / "05a-companion-idle-ipad.png"), full_page=True)

    room = page.locator(".companion-room").bounding_box()
    dog = page.locator(".puppy-hit-area").bounding_box()
    assert room and dog, "puppy or room has no rendered bounding box"
    assert dog["x"] >= room["x"] and dog["y"] >= room["y"], "puppy escaped room top-left"
    assert dog["x"] + dog["width"] <= room["x"] + room["width"] + 1, "puppy escaped room right"
    assert dog["y"] + dog["height"] <= room["y"] + room["height"] + 1, "puppy escaped room bottom"

    hit = page.locator('[aria-label="和小狗豆豆互动"]')
    hit.click()
    assert page.locator('[data-testid="puppy-motion"]').get_attribute("data-state") == "tap-react"
    page.wait_for_timeout(260)
    page.screenshot(path=str(OUT / "05b-companion-tap-react.png"), full_page=True)
    page.wait_for_timeout(1100)
    assert page.locator('[data-testid="puppy-motion"]').get_attribute("data-state") == "idle"

    page.get_by_role("button", name="庆祝").click()
    assert page.locator('[data-testid="puppy-motion"]').get_attribute("data-state") == "celebrate"
    page.wait_for_timeout(180)
    page.screenshot(path=str(OUT / "05c-companion-celebrate.png"), full_page=True)

    # Capture a short cropped GIF around the puppy for visual review.
    dog_box = page.locator(".puppy-hit-area").bounding_box()
    assert dog_box
    for frame in range(12):
        page.screenshot(
            path=str(OUT / f"companion-frame-{frame:02d}.png"),
            clip={
                "x": max(0, dog_box["x"] - 18),
                "y": max(0, dog_box["y"] - 18),
                "width": min(380, dog_box["width"] + 36),
                "height": min(380, dog_box["height"] + 36),
            },
        )
        page.wait_for_timeout(110)

    mobile = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    mobile.goto(BASE_URL)
    mobile.wait_for_load_state("networkidle")
    mobile.wait_for_selector('[aria-label="陪伴小狗豆豆"]')
    mobile.screenshot(path=str(OUT / "05d-companion-iphone.png"), full_page=True)
    mobile_room = mobile.locator(".companion-room").bounding_box()
    mobile_dog = mobile.locator(".puppy-hit-area").bounding_box()
    assert mobile_room and mobile_dog
    assert mobile_dog["x"] >= mobile_room["x"] and mobile_dog["x"] + mobile_dog["width"] <= mobile_room["x"] + mobile_room["width"] + 1
    assert mobile_dog["y"] >= mobile_room["y"] and mobile_dog["y"] + mobile_dog["height"] <= mobile_room["y"] + mobile_room["height"] + 1

    reduced = browser.new_page(viewport={"width": 1024, "height": 768}, reduced_motion="reduce")
    reduced.goto(BASE_URL)
    reduced.wait_for_load_state("networkidle")
    reduced.wait_for_selector('.puppy-sprite[aria-label="陪伴小狗豆豆"]')
    reduced.screenshot(path=str(OUT / "05e-companion-reduced-motion.png"), full_page=True)

    assert not errors, f"console errors: {errors}"
    print("Companion preview passed: desktop, iPhone, reduced motion, tap reaction, celebrate state.")
    browser.close()
