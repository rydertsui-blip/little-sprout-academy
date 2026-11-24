from pathlib import Path
import os
from playwright.sync_api import sync_playwright

BASE = os.getenv("BASE_URL", "http://127.0.0.1:4186/family/")
SHOTS = Path("work/family-audit/redesign")
errors = []

def tap(page, locator):
    locator.wait_for(state="visible")
    locator.scroll_into_view_if_needed()
    locator.tap(timeout=10000)

def assert_clean(page, label):
    overflow = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    assert overflow <= 1, f"{label}: horizontal overflow {overflow}px"
    small = page.evaluate("""
      [...document.querySelectorAll('button, summary')]
        .filter((el) => {
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
        })
        .map((el) => el.textContent.trim().slice(0, 30))
    """)
    assert not small, f"{label}: small targets {small}"
    broken = page.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'))")
    assert not broken, f"{label}: broken images {broken}"
    print(label, "clean")

def setup_family(page):
    page.get_by_label("家庭名称").fill("我们的学习区")
    page.get_by_label("家长称呼").fill("妈妈")
    page.get_by_label("家长密码").fill("2468")
    tap(page, page.get_by_role("button", name="建立家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")

def open_parent(page):
    tap(page, page.get_by_role("button", name="家长设置"))
    page.wait_for_selector("text=进入家长设置")
    page.get_by_label("家长密码确认").fill("2468")
    tap(page, page.get_by_role("button", name="进入设置"))
    page.wait_for_selector("text=孩子学习情况")

def close_parent(page):
    tap(page, page.get_by_role("button", name="关闭"))
    page.wait_for_selector("text=今天谁来学习？")

def add_child(page, name, avatar, first=False):
    open_parent(page)
    tap(page, page.get_by_role("button", name="添加第一个孩子" if first else "添加孩子"))
    page.get_by_label("孩子的名字").fill(name)
    page.wait_for_selector(".avatar-picker")
    count = page.locator(".avatar-choice").count()
    assert count == 20, f"expected 20 avatars, got {count}"
    page.wait_for_timeout(600)
    loaded = page.locator(".avatar-choice img").evaluate_all("imgs => imgs.every(i => i.complete && i.naturalWidth > 0)")
    assert loaded, "not all avatar images loaded"
    page.locator(".avatar-choice img").first.wait_for(state="visible")
    if first:
        page.screenshot(path=str(SHOTS / "25-wide-avatar-picker-bg.png"), full_page=True)
        page.locator(".modal-card").screenshot(path=str(SHOTS / "25-wide-avatar-picker.png"))
    tap(page, page.get_by_role("button", name=avatar))
    page.wait_for_timeout(150)
    if first:
        page.locator(".modal-card").screenshot(path=str(SHOTS / "26-wide-avatar-selected.png"))
    tap(page, page.get_by_role("button", name="保存档案"))
    page.get_by_role("heading", name=name).wait_for(state="visible")
    close_parent(page)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width":1180,"height":820}, has_touch=True, locale="zh-SG", timezone_id="Asia/Singapore", device_scale_factor=1)
    page = context.new_page()
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(BASE, wait_until="networkidle")
    page.evaluate("localStorage.clear()")
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(300)
    setup_family(page)
    add_child(page, "小星", "蜘蛛侠头像", first=True)
    add_child(page, "小月", "艾莎头像")
    page.wait_for_timeout(300)
    open_parent(page)
    page.screenshot(path=str(SHOTS / "31-wide-avatar-parent.png"), full_page=True)
    close_parent(page)
    assert_clean(page, "wide avatar profiles")
    page.screenshot(path=str(SHOTS / "27-wide-avatar-profiles.png"), full_page=True)
    tap(page, page.locator("button[aria-label='小星的学习档案']"))
    page.wait_for_selector("text=跟小芽开始")
    page.screenshot(path=str(SHOTS / "28-wide-spider-home.png"), full_page=True)

    page.set_viewport_size({"width":390,"height":844})
    page.wait_for_timeout(300)
    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(300)
    if page.get_by_role("heading", name="输入家长密码").is_visible():
        page.get_by_label("家长密码").fill("2468")
        tap(page, page.get_by_role("button", name="打开家庭学习区"))
    page.wait_for_selector("text=今天谁来学习？")
    assert_clean(page, "phone avatar profiles")
    page.screenshot(path=str(SHOTS / "29-phone-avatar-profiles.png"), full_page=True)
    open_parent(page)
    page.screenshot(path=str(SHOTS / "32-phone-avatar-parent.png"), full_page=True)
    tap(page, page.get_by_role("button", name="修改档案").first)
    page.wait_for_selector(".avatar-picker")
    page.wait_for_timeout(300)
    assert_clean(page, "phone avatar picker")
    page.locator(".modal-card").screenshot(path=str(SHOTS / "30-phone-avatar-picker.png"))
    print("avatars:", page.locator(".avatar-choice").count())
    assert not errors, errors
    print("done, errors:", len(errors))
    browser.close()
