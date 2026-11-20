from pathlib import Path
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4173/family/")
SHOTS = Path("work/family-audit")
errors = []

def tap(page, locator):
    locator.wait_for(state="visible")
    locator.scroll_into_view_if_needed()
    box = locator.bounding_box()
    assert box, "Missing touch target"
    page.touchscreen.tap(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)

def assert_layout(page, label):
    assert page.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1"), f"{label}: horizontal overflow"
    broken = page.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)")
    assert not broken, f"{label}: broken images {broken}"

with sync_playwright() as p:
    browser = p.webkit.launch(headless=True)
    context = browser.new_context(
        viewport={"width": 1024, "height": 768},
        has_touch=True,
        locale="zh-SG",
        timezone_id="Asia/Singapore",
    )
    page = context.new_page()
    page.on("console", lambda msg: errors.append(f"console:{msg.type}:{msg.text}") if msg.type == "error" else None)
    page.on("pageerror", lambda exc: errors.append(f"pageerror:{exc}"))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(350)
    assert_layout(page, "WebKit setup")

    tap(page, page.get_by_label("家庭名称"))
    page.get_by_label("家庭名称").fill("Safari 学习区")
    tap(page, page.get_by_label("家长称呼"))
    page.get_by_label("家长称呼").fill("妈妈")
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    tap(page, page.get_by_role("button", name="家长设置"))
    tap(page, page.get_by_label("家长密码确认"))
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习概览")
    tap(page, page.get_by_role("button", name="添加第一个孩子"))
    tap(page, page.get_by_label("孩子的名字"))
    page.get_by_label("孩子的名字").fill("小苹果")
    tap(page, page.get_by_role("button", name="花朵头像"))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name="小苹果").wait_for(state="visible")
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector("button[aria-label='小苹果的学习档案']")
    assert_layout(page, "WebKit profiles")
    page.screenshot(path=str(SHOTS / "13-webkit-ipad-profiles.png"), full_page=True)

    tap(page, page.locator("button[aria-label='小苹果的学习档案']"))
    assert_layout(page, "WebKit child home")
    tap(page, page.get_by_role("button", name="数学 Math"))
    page.wait_for_timeout(300)
    assert_layout(page, "WebKit math quiz")
    tap(page, page.locator("button[data-correct='false']").first)
    page.wait_for_selector("[data-testid=answer-feedback]")
    page.wait_for_timeout(320)
    assert page.locator(".wrong-feedback").is_visible()
    assert "is-correct-answer" in (page.locator("button[data-correct='true']").first.get_attribute("class") or "")
    page.screenshot(path=str(SHOTS / "14-webkit-ipad-feedback.png"), full_page=True)
    tap(page, page.get_by_role("button", name="下一题"))
    tap(page, page.get_by_role("button", name="退出"))
    tap(page, page.get_by_role("button", name="英语 English"))
    page.wait_for_timeout(300)
    tap(page, page.locator("button[data-correct='true']").first)
    page.wait_for_selector("[data-testid=answer-feedback]")
    page.wait_for_timeout(320)
    assert "1 / 8" in page.locator(".session-progress").inner_text()

    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    assert page.get_by_role("heading", name="输入家长密码").is_visible()
    tap(page, page.get_by_label("家长密码"))
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")

    page.set_viewport_size({"width": 768, "height": 1024})
    page.wait_for_timeout(300)
    assert_layout(page, "WebKit portrait profiles")
    page.screenshot(path=str(SHOTS / "15-webkit-ipad-portrait.png"), full_page=True)

    assert not errors, "WebKit browser errors:\n" + "\n".join(errors)
    print("PASS: WebKit touch setup, profile creation, wrong-answer feedback, subject entry, reload lock and portrait layout")
    browser.close()
